/**
 * Hacker News gravity decay formula for campus posts:
 * hotScore = score / ((ageHours + 2) ^ gravity)
 *
 * Default gravity is 1.5. A +2 hour penalty prevents brand new
 * 1-vote posts from permanently crowding the top of the feed,
 * while allowing consistently voted posts to maintain visibility.
 */
export function calculateHotScore(
  score: number,
  createdAt: Date,
  gravity: number = 1.5
): number {
  const now = Date.now();
  const createdTime = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  const ageHours = Math.max(0, (now - createdTime) / (1000 * 3600));
  const denominator = Math.pow(ageHours + 2, gravity);

  return Number((score / denominator).toFixed(4));
}
