import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

/**
 * Callable function to permanently delete a user account and associated private data.
 * Complies with Apple App Store Guideline 5.1.1(v) & Google Play User Data Policy.
 */
export const deleteAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to delete account.');
  }

  const uid = request.auth.uid;
  const db = admin.firestore();

  // 1. Delete user subcollections
  const subcollections = ['bookmarks', 'blockedAuthors', 'blockedPosts', 'moodCheckIns'];
  for (const subCol of subcollections) {
    const snap = await db.collection('users').doc(uid).collection(subCol).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  // 2. Delete main user document
  await db.collection('users').doc(uid).delete();

  // 3. Delete Firebase Auth record
  try {
    await admin.auth().deleteUser(uid);
  } catch (err: any) {
    console.error(`Failed to delete Firebase Auth user ${uid}:`, err);
    throw new HttpsError('internal', `Failed to delete auth user: ${err.message}`);
  }

  return { success: true, message: 'Account and associated data deleted successfully.' };
});
