export const WITHDRAWAL_PAYMENT_BUSINESS_DAYS = 12;

export function calculateWithdrawalDueAt(requestedAt: Date) {
  const dueAt = new Date(requestedAt);
  let addedBusinessDays = 0;

  while (addedBusinessDays < WITHDRAWAL_PAYMENT_BUSINESS_DAYS) {
    dueAt.setDate(dueAt.getDate() + 1);

    const dayOfWeek = dueAt.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedBusinessDays += 1;
    }
  }

  return dueAt;
}
