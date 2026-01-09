import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UserType } from "@prisma/client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { newChat?: string };
}) {
  // 1. Pega o ID do usuário dos cookies
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  // 2. Verifica no banco quem é esse usuário
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });

  if (!user) {
    redirect("/login"); // Usuário não existe mais? Volta pro login
  }

  // 3. Redirecionamento baseado no Role (UserType)

  if (user.userType === UserType.PROFESSIONAL) {
    redirect("/dashboard/profissional");
  }

  if (user.userType === UserType.CLIENT) {
    // Se for cliente E tiver pedido para abrir chat, vai pro chat
    if (searchParams?.newChat) {
      redirect(`/dashboard/chat?newChat=${searchParams.newChat}`);
    }
    // Senão, vai pra home do cliente
    redirect("/dashboard/cliente");
  }

  // Fallback visual enquanto redireciona
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#d73cbe] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Carregando seu painel...</p>
      </div>
    </div>
  );
}
