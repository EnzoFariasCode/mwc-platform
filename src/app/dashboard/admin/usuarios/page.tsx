import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { getAdminUsers } from "@/modules/admin/actions/user-actions";
import AdminUsuariosView, { AdminUserItem } from "./AdminUsuariosView";

export default async function AdminUsuariosPage() {
  const users = await getAdminUsers();

  const safeUsers: AdminUserItem[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    industry: user.industry,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <PageContainer>
      <AdminUsuariosView users={safeUsers} />
    </PageContainer>
  );
}
