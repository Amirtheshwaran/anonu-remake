import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface UnblockAuthorData {
  targetUid?: string;
  postId?: string;
}

export const unblockAuthor = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in.');
  }

  const blockerUid = request.auth.uid;
  const data: UnblockAuthorData = request.data || {};
  const db = admin.firestore();

  let targetUid = data.targetUid;
  if (!targetUid && data.postId) {
    const authorSnap = await db.collection('postAuthors').doc(data.postId).get();
    if (authorSnap.exists) {
      targetUid = authorSnap.data()?.uid;
    }
  }

  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Missing target author reference.');
  }

  // Remove from blockedAuthors
  await db
    .collection('users')
    .doc(blockerUid)
    .collection('blockedAuthors')
    .doc(targetUid)
    .delete();

  // Remove their posts from blockedPosts
  const authoredPostsSnap = await db
    .collection('postAuthors')
    .where('uid', '==', targetUid)
    .get();

  const batch = db.batch();
  authoredPostsSnap.docs.forEach((doc) => {
    const ref = db.collection('users').doc(blockerUid).collection('blockedPosts').doc(doc.id);
    batch.delete(ref);
  });

  await batch.commit();

  return { success: true };
});
