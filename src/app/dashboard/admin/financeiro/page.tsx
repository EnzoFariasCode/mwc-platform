import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { getPendingWithdrawals } from "@/modules/admin/actions/get-withdrawals";
import AdminFinanceiroView, { AdminWithdrawalItem } from "./AdminFinanceiroView";

export default async function AdminFinanceiroPage() {
  const withdrawals = await getPendingWithdrawals();

  const safeWithdrawals: AdminWithdrawalItem[] = withdrawals.map(
    (withdrawal) => ({
      id: withdrawal.id,
      amount: withdrawal.amount.toNumber(),
      pixKey: withdrawal.pixKey,
      pixKeyType: withdrawal.pixKeyType,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt.toISOString(),
      transactionId: withdrawal.transactionId,
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
