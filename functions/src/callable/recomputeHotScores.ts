import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { processHotScoreDecay } from '../scheduled/recomputeActiveHotScores';

export const recomputeHotScores = onCall(async (request) => {
  // Require authenticated user
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to trigger hot score recomputation.');
  }

  try {
    const result = await processHotScoreDecay();
    return {
      success: true,
      updatedCount: result.updatedCount,
      scannedCount: result.scannedCount,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    throw new HttpsError('internal', err.message || 'Failed to recompute hot scores.');
  }
});
