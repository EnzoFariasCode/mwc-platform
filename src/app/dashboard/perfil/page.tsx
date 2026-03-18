/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import PerfilView from "@/modules/users/components/PerfilView";

export default async function PerfilPage() {
  // 1. Autenticação
  const session = await verifySession();

  if (!session || !session.sub) {
    redirect("/login");
  }

  // 2. Buscar dados
  const user = await db.user.findUnique({
    where: { id: session.sub as string },
  });

  if (!user) {
    redirect("/login");
  }

  // 3. TRATAMENTO DE DADOS (A MÁGICA ACONTECE AQUI)
  // O banco não tem 'avatarUrl', então criamos esse campo dinamicamente
  // se houver 'profileImageBytes' salvo.

  const hasImage = user.profileImageBytes !== null;

  // Criamos um objeto limpo para o front-end
  const userDataForFrontend = {
    ...user,
    // Se tiver bytes no banco, a URL é a rota da API. Se não, é null.
    avatarUrl: hasImage
      ? `/api/images/user/${user.id}?t=${user.updatedAt.getTime()}`
      : null,

    // IMPORTANTE: Removemos o arquivo binário pesado para não travar o navegador
    profileImageBytes: undefined,
  };

  // 4. Renderiza a view passando os dados tratados
  return <PerfilView user={userDataForFrontend as any} />;
}
