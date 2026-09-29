import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface SetModeratorData {
  targetUid: string;
  isModerator: boolean;
}

export const setModeratorClaim = onCall(async (request) => {
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';

  // In production, only users who already have admin or moderator claim can grant it
  if (!isEmulated) {
    if (!request.auth || !request.auth.token.isModerator) {
      throw new HttpsError('permission-denied', 'Only existing moderators can assign privileges.');
    }
  }

  const { targetUid, isModerator } = request.data as SetModeratorData;
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Missing targetUid.');
  }

  await admin.auth().setCustomUserClaims(targetUid, { isModerator: !!isModerator });

  await admin
    .firestore()
    .collection('users')
    .doc(targetUid)
    .set({ isModerator: !!isModerator }, { merge: true });

  return { success: true, targetUid, isModerator: !!isModerator };
});
