import { getUserProfile } from "@/actions/account/get-user-profile";
import { redirect } from "next/navigation";
import PerfilView from "@/components/dashboard/perfil/PerfilView";

export default async function PerfilPage() {
  // 1. Busca os dados reais do usuário logado
  const user = await getUserProfile();

  // 2. Segurança básica
  if (!user) {
    redirect("/login");
  }

  // 3. Renderiza a view passando os dados
  // Precisamos converter o user para o tipo esperado se necessário,
  // mas como o Prisma retorna o objeto compatível, deve funcionar direto.
  return <PerfilView user={user as any} />;
}
