import { getPublicProfile } from "@/actions/public/get-public-profile";
import { verifySession } from "@/lib/auth";
import { ProfileShowcase } from "@/components/features/profile-showcase";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma"; // <--- IMPORTADO PARA ATUALIZAR O BANCO

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardProfilePage({ params }: PageProps) {
  const { id } = await params;

  const professional = await getPublicProfile(id);

  if (!professional) {
    return notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  const isOwner = session?.sub === professional.id;

  if (!isOwner) {
    try {
      await db.user.update({
        where: { id: professional.id },
        data: { profileViews: { increment: 1 } },
      });
    } catch (error) {
      console.error("Erro ao registrar visualização de perfil:", error);
    }
  }

  return (
    <PageContainer>
      <ProfileShowcase
        professional={professional as any}
        isAuthenticated={true}
        isOwner={isOwner}
        backHref="/dashboard/encontrar-profissionais" // <--- Conectando o botão voltar
      />
    </PageContainer>
  );
}
