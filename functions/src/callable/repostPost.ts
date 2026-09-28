import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generatePostPseudonym } from '../utils/pseudonym';
import { checkRateLimit } from '../utils/rateLimit';

interface RepostData {
  postId: string;
}

export const repostPost = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to repost.');
  }

  const { uid, token } = request.auth;
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!token.email_verified && !isEmulated) {
    throw new HttpsError('permission-denied', 'University email must be verified to repost.');
  }

  await checkRateLimit(uid, 'post', 10);

  const { postId } = request.data as RepostData;
  if (!postId) {
    throw new HttpsError('invalid-argument', 'Missing postId.');
  }

  const db = admin.firestore();
  const originalRef = db.collection('posts').doc(postId);
  const originalSnap = await originalRef.get();

  if (!originalSnap.exists) {
    throw new HttpsError('not-found', 'Original publication not found.');
  }

  const orig = originalSnap.data() || {};
  if (orig.isHidden) {
    throw new HttpsError('failed-precondition', 'Cannot repost a hidden publication.');
  }

  const newPostRef = db.collection('posts').doc();
  const newPostId = newPostRef.id;
  const pseudonym = generatePostPseudonym(uid, newPostId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    // 1. Private author mapping for the repost
    const authorRef = db.collection('postAuthors').doc(newPostId);
    transaction.set(authorRef, {
      uid,
      createdAt: now,
      isRepostOf: postId,
    });

    // 2. Public repost document
    transaction.set(newPostRef, {
      identity: 'anonymous',
      pseudonym,
      authorProfileId: null,
      displayName: null,
      avatarUrl: null,
      content: orig.content,
      type: orig.type || 'text',
      tags: orig.tags || [],
      imageUrls: orig.imageUrls || [],
      poll: orig.poll || null,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      hotScore: 0,
      commentCount: 0,
      repostCount: 0,
      createdAt: now,
      expiresAt: null,
      isHidden: false,
      isRepost: true,
      originalPostId: postId,
      originalAuthorPseudonym: orig.pseudonym || 'Anonymous',
    });

    // 3. Increment repostCount on original post
    transaction.update(originalRef, {
      repostCount: admin.firestore.FieldValue.increment(1),
    });
  });

  // Safe notification to original author
  try {
    const origAuthorSnap = await db.collection('postAuthors').doc(postId).get();
    if (origAuthorSnap.exists) {
      const origAuthorUid = origAuthorSnap.data()?.uid;
      if (origAuthorUid && origAuthorUid !== uid) {
        await db.collection('notifications').add({
          recipientUid: origAuthorUid,
          type: 'repost',
          message: `@${pseudonym} reposted your publication on campus.`,
          postId,
          postPreview: orig.content ? orig.content.slice(0, 60) : null,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.error('Error sending repost alert:', err);
  }

  return { newPostId, pseudonym };
});
