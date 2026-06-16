import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { getAdminWithdrawals } from "@/modules/admin/actions/get-withdrawals";
import AdminFinanceiroView, { AdminWithdrawalItem } from "./AdminFinanceiroView";

export default async function AdminFinanceiroPage() {
  const withdrawals = await getAdminWithdrawals();

  const safeWithdrawals: AdminWithdrawalItem[] = withdrawals.map(
    (withdrawal) => ({
      id: withdrawal.id,
      amount: withdrawal.amount.toNumber(),
      pixKey: withdrawal.pixKey,
      pixKeyType: withdrawal.pixKeyType,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt.toISOString(),
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
      <AdminFinanceiroView withdrawals={safeWithdrawals} />
    </PageContainer>
  );
}
