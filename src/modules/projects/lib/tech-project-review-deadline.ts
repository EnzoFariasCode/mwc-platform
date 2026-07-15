export const TECH_PROJECT_REVIEW_DAYS = 7;
export const TECH_PROJECT_REVIEW_MS =
  TECH_PROJECT_REVIEW_DAYS * 24 * 60 * 60 * 1000;

export function getTechProjectReviewDeadline(deliveredAt: Date) {
  return new Date(deliveredAt.getTime() + TECH_PROJECT_REVIEW_MS);
}

export function isTechProjectReviewExpired(
  reviewDeadlineAt: Date,
  now = new Date(),
) {
  return now.getTime() >= reviewDeadlineAt.getTime();
}
