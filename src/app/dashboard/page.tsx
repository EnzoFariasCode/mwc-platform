import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";
import { verifySession } from "@/lib/auth"; // <--- Importante: Importar a função de segurança

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ newChat?: string }>; // Next.js 15: params são Promises agora
}) {
  const { newChat } = await searchParams; // Resolvemos a promise dos params

  const session = await verifySession();

  // Se o token for inválido, falso ou não tiver ID -> Login
  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string; // O ID real do usuário

  // 3. Verifica no banco quem é esse usuário
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });

  if (!user) {
    redirect("/login");
  }

  // 4. Redirecionamento baseado no Role (UserType)
  if (user.userType === UserType.PROFESSIONAL) {
    redirect("/dashboard/profissional");
  }

  if (user.userType === UserType.CLIENT) {
    // Se for cliente E tiver pedido para abrir chat, vai pro chat
    if (newChat) {
      redirect(`/dashboard/chat?newChat=${newChat}`);
    }
    // Senão, vai pra home do cliente
    redirect("/dashboard/cliente");
  }

  // Fallback visual (EXATAMENTE COMO VOCÊ PEDIU)
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#d73cbe] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Carregando seu painel...</p>
      </div>
    </div>
  );
}
