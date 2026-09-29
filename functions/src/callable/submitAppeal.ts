import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface SubmitAppealData {
  strikeId: string;
  explanation: string;
}

export const submitAppeal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in.');
  }

  const uid = request.auth.uid;
  const { strikeId, explanation } = request.data as SubmitAppealData;

  if (!strikeId || !explanation?.trim()) {
    throw new HttpsError('invalid-argument', 'Missing strikeId or explanation.');
  }

  const db = admin.firestore();
  const appealRef = db.collection('appeals').doc();

  await appealRef.set({
    id: appealRef.id,
    uid,
    strikeId,
    explanation: explanation.trim(),
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, appealId: appealRef.id };
});
