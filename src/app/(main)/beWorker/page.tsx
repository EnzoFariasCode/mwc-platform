import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";

// Componentes
import StandardHeader from "@/components/ui/StandardHeader";
import FooterContact from "@/components/ui/FooterContact";
import BeWorkerClient from "@/modules/landing/worker/BeWorkerClient";

export default async function HowToBeWorkerPage() {
  // 1. Busca dados do usuário (Servidor)
  const session = await getUserSession();
  let userStatus: "active" | "inactive" | null = null;
  
  // Criamos a variável para guardar o tipo de usuário
  let userType: "CLIENT" | "PROFESSIONAL" | "ADMIN" | null = null;

  if (session?.id) {
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { 
        stripeSubscriptionStatus: true,
        userType: true, // <-- ADICIONAMOS A BUSCA AQUI
      },
    });
    
    userStatus = user?.stripeSubscriptionStatus === "active" ? "active" : "inactive";
    userType = user?.userType || null; // Guardamos a informação
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Header (Server Component) */}
      <StandardHeader />

      {/* Conteúdo Visual (Client Component) */}
      <BeWorkerClient 
        isLoggedIn={!!session} 
        userStatus={userStatus} 
        userType={userType} // <-- REPASSAMOS PARA A TRAVA DO MODAL FUNCIONAR
      />

      {/* Footer (Server Component) */}
      <FooterContact />
    </div>
  );
}
