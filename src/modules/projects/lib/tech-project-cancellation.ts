export const TECH_PROJECT_CANCELLATION_WINDOW_HOURS = 12;

export const TECH_PROJECT_CANCELLATION_WINDOW_MS =
  TECH_PROJECT_CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;

export function getTechProjectCancellationDeadline(
  paymentConfirmedAt: Date,
) {
  return new Date(
    paymentConfirmedAt.getTime() + TECH_PROJECT_CANCELLATION_WINDOW_MS,
  );
}

export function canCancelPaidTechProject(
  paymentConfirmedAt: Date,
  now = new Date(),
) {
  return now <= getTechProjectCancellationDeadline(paymentConfirmedAt);
}
