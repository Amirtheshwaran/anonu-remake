import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface ResolveReportData {
  reportId: string;
  postId?: string;
  hidePost?: boolean;
}

export const resolveReport = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { uid, token } = request.auth;

  // Check moderator privileges (custom claim or user doc)
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  const db = admin.firestore();

  let isModerator = Boolean(token.moderator);
  if (!isModerator) {
    const userDoc = await db.collection('users').doc(uid).get();
    isModerator = Boolean(userDoc.data()?.isModerator);
  }

  if (!isModerator && !isEmulated) {
    throw new HttpsError('permission-denied', 'Only campus moderators can resolve incident reports.');
  }

  const { reportId, postId, hidePost } = request.data as ResolveReportData;
  if (!reportId) {
    throw new HttpsError('invalid-argument', 'Missing reportId.');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Mark report as resolved
  await db.collection('reports').doc(reportId).set(
    {
      status: 'resolved',
      resolvedBy: uid,
      resolvedAt: now,
    },
    { merge: true }
  );

  // 2. Hide post if requested
  if (hidePost && postId) {
    await db.collection('posts').doc(postId).update({
      isHidden: true,
      hiddenAt: now,
      hiddenReason: 'Moderator action',
    });
  }

  return { success: true };
});
