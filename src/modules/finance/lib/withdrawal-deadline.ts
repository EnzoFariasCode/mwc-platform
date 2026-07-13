export const WITHDRAWAL_PAYMENT_DAYS = 12;

export function calculateWithdrawalDueAt(requestedAt: Date) {
  const dueAt = new Date(requestedAt);
  dueAt.setDate(dueAt.getDate() + WITHDRAWAL_PAYMENT_DAYS);
  return dueAt;
}
