import { getPublicProfile } from "@/actions/public/get-public-profile";
import { verifySession } from "@/lib/auth";
import { ProfileShowcase } from "@/components/features/profile-showcase";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

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
