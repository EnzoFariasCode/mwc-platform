import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { getAdminWithdrawals } from "@/modules/admin/actions/get-withdrawals";
import AdminFinanceiroView, { AdminWithdrawalItem } from "./AdminFinanceiroView";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminFinanceiroPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = {
    page: Number(valueOf(params.page)) || 1,
    search: valueOf(params.q) || "",
    status: valueOf(params.status) || "PENDING",
    dateFrom: valueOf(params.dateFrom) || "",
    dateTo: valueOf(params.dateTo) || "",
  } as const;
  const result = await getAdminWithdrawals(query);

  const safeWithdrawals: AdminWithdrawalItem[] = result.items.map(
    (withdrawal) => ({
      id: withdrawal.id,
      amount: withdrawal.amount.toNumber(),
      pixKey: withdrawal.pixKey,
      pixKeyType: withdrawal.pixKeyType,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt.toISOString(),
      requestedAt: withdrawal.requestedAt.toISOString(),
      dueAt: withdrawal.dueAt.toISOString(),
      processedAt: withdrawal.processedAt?.toISOString() ?? null,
      failedAt: withdrawal.failedAt?.toISOString() ?? null,
      failureReason: withdrawal.failureReason,
      providerRef: withdrawal.providerRef,
      transactionId: withdrawal.transactionId,
      auditLog: withdrawal.auditLog
        ? {
            id: withdrawal.auditLog.id,
            action: withdrawal.auditLog.action,
            reason: withdrawal.auditLog.reason,
            receiptUrl: withdrawal.auditLog.receiptUrl,
            receiptFileName: withdrawal.auditLog.receiptFileName,
            receiptFileType: withdrawal.auditLog.receiptFileType,
            createdAt: withdrawal.auditLog.createdAt.toISOString(),
            actorName: withdrawal.auditLog.actorName,
            actorEmail: withdrawal.auditLog.actorEmail,
          }
        : null,
      user: {
        id: withdrawal.user.id,
        name: withdrawal.user.name,
        email: withdrawal.user.email,
        walletBalance: withdrawal.user.walletBalance.toNumber(),
      },
    }),
  );

  return (
    <PageContainer>
      <AdminFinanceiroView
        withdrawals={safeWithdrawals}
        pagination={result.pagination}
        summary={result.summary}
        query={query}
      />
    </PageContainer>
  );
}
