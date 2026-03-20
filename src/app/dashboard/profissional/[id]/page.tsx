/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPublicProfile } from "@/modules/users/actions/get-public-profile";
import { verifySession } from "@/lib/auth";
import { ProfileShowcase } from "@/modules/users/components/profile-showcase";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma"; // <--- IMPORTADO PARA ATUALIZAR O BANCO

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardProfilePage({ params }: PageProps) {
  const { id } = await params;

  const result = await getPublicProfile(id);

  if (!result.success || !result.data) {
    return notFound();
  }

  const professional = result.data;

  const session = await verifySession();

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
