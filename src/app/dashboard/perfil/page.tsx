import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import PerfilView from "@/components/dashboard/perfil/PerfilView";

export default async function PerfilPage() {
  // 1. Autenticação (Pegar sessão segura)
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || !session.sub) {
    redirect("/login");
  }

  // 2. Buscar TODOS os dados do usuário diretamente do banco
  // O findUnique sem 'select' traz todos os campos, incluindo os do Stripe que acabamos de criar
  const user = await db.user.findUnique({
    where: { id: session.sub as string },
  });

  // 3. Segurança básica se não achar o user
  if (!user) {
    redirect("/login");
  }

  // 4. Renderiza a view passando os dados
  // O 'as any' garante que os tipos do Prisma (Date, nulls) passem sem conflito para o componente
  return <PerfilView user={user as any} />;
}
