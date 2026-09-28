import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface BlockAuthorData {
  postId?: string;
  commentId?: string;
}

export const blockAuthor = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to block an author.');
  }

  const blockerUid = request.auth.uid;
  const data: BlockAuthorData = request.data || {};

  if (!data.postId && !data.commentId) {
    throw new HttpsError('invalid-argument', 'Must provide either postId or commentId.');
  }

  const db = admin.firestore();
  let targetAuthorUid: string | null = null;
  let targetPostId = data.postId;

  if (data.postId) {
    const authorSnap = await db.collection('postAuthors').doc(data.postId).get();
    if (authorSnap.exists) {
      targetAuthorUid = authorSnap.data()?.uid || null;
    }
  } else if (data.commentId) {
    const commentAuthorSnap = await db.collection('commentAuthors').doc(data.commentId).get();
    if (commentAuthorSnap.exists) {
      targetAuthorUid = commentAuthorSnap.data()?.uid || null;
      targetPostId = commentAuthorSnap.data()?.postId || null;
    }
  }

  if (!targetAuthorUid) {
    throw new HttpsError('not-found', 'Could not locate author record to block.');
  }

  if (targetAuthorUid === blockerUid) {
    throw new HttpsError('invalid-argument', 'You cannot block yourself.');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Record in blocker's private blockedAuthors collection
  await db
    .collection('users')
    .doc(blockerUid)
    .collection('blockedAuthors')
    .doc(targetAuthorUid)
    .set({
      blockedAt: now,
    });

  // 2. Fetch all posts authored by this user so blocker's feed can hide them
  const authoredPostsSnap = await db
    .collection('postAuthors')
    .where('uid', '==', targetAuthorUid)
    .get();

  const batch = db.batch();
  authoredPostsSnap.docs.forEach((doc) => {
    const blockedPostRef = db
      .collection('users')
      .doc(blockerUid)
      .collection('blockedPosts')
      .doc(doc.id);
    batch.set(blockedPostRef, {
      postId: doc.id,
      blockedAt: now,
    });
  });

  // Ensure current post is also marked blocked
  if (targetPostId) {
    const currentPostBlockedRef = db
      .collection('users')
      .doc(blockerUid)
      .collection('blockedPosts')
      .doc(targetPostId);
    batch.set(currentPostBlockedRef, {
      postId: targetPostId,
      blockedAt: now,
    });
  }

  await batch.commit();

  // Return success without revealing the author UID
  return { success: true, message: 'Author and their publications blocked successfully.' };
});
