import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { getAdminUsers } from "@/modules/admin/actions/user-actions";
import AdminUsuariosView, { AdminUserItem } from "./AdminUsuariosView";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = {
    page: Number(valueOf(params.page)) || 1,
    search: valueOf(params.q) || "",
    userType: valueOf(params.userType) || "ALL",
    industry: valueOf(params.industry) || "ALL",
    status: valueOf(params.status) || "ALL",
    dateFrom: valueOf(params.dateFrom) || "",
    dateTo: valueOf(params.dateTo) || "",
  } as const;
  const result = await getAdminUsers(query);

  const safeUsers: AdminUserItem[] = result.items.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    industry: user.industry,
    adminRole: user.adminRole,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    auditLog: user.auditLog
      ? {
          id: user.auditLog.id,
          action: user.auditLog.action,
          reason: user.auditLog.reason,
          createdAt: user.auditLog.createdAt.toISOString(),
          actorName: user.auditLog.actorName,
          actorEmail: user.auditLog.actorEmail,
        }
      : null,
  }));

  return (
    <PageContainer>
      <AdminUsuariosView
        users={safeUsers}
        pagination={result.pagination}
        query={query}
      />
    </PageContainer>
  );
}
