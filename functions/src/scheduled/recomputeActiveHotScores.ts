import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { calculateHotScore } from '../utils/decay';

export async function processHotScoreDecay(maxBatch = 200): Promise<{ updatedCount: number; scannedCount: number }> {
  const db = admin.firestore();
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(twoDaysAgo);

  const postsQuery = await db
    .collection('posts')
    .where('isHidden', '==', false)
    .where('createdAt', '>=', cutoffTimestamp)
    .limit(maxBatch)
    .get();

  if (postsQuery.empty) {
    return { updatedCount: 0, scannedCount: 0 };
  }

  const batch = db.batch();
  let updatedCount = 0;

  for (const doc of postsQuery.docs) {
    const data = doc.data();
    const score = data.score || 0;
    const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
    const currentHotScore = typeof data.hotScore === 'number' ? data.hotScore : 0;

    const freshHotScore = calculateHotScore(score, createdAt);

    // Only write if there is a noticeable decay difference (saves Firestore writes)
    if (Math.abs(freshHotScore - currentHotScore) >= 0.001) {
      batch.update(doc.ref, { hotScore: freshHotScore });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await batch.commit();
  }

  return { updatedCount, scannedCount: postsQuery.docs.length };
}

export const recomputeActiveHotScores = onSchedule('every 15 minutes', async () => {
  try {
    const result = await processHotScoreDecay();
    console.log(`Hot score decay complete: updated ${result.updatedCount} of ${result.scannedCount} active posts.`);
  } catch (err) {
    console.error('Error executing recomputeActiveHotScores:', err);
  }
});
