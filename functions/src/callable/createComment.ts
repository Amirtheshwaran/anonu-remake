import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { MAX_COMMENT_LENGTH } from '../constants';
import { generatePostPseudonym } from '../utils/pseudonym';
import { checkRateLimit } from '../utils/rateLimit';

interface CreateCommentData {
  postId: string;
  content: string;
  identity: 'anonymous' | 'identified';
  parentCommentId?: string | null;
}

export const createComment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to comment.');
  }

  const { uid, token } = request.auth;
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!token.email_verified && !isEmulated) {
    throw new HttpsError('permission-denied', 'University email must be verified before commenting.');
  }

  // Rate limit: 40 comments per hour
  await checkRateLimit(uid, 'comment', 40);

  const data: CreateCommentData = request.data;
  const content = (data.content || '').trim();

  if (!data.postId) {
    throw new HttpsError('invalid-argument', 'Missing postId.');
  }
  if (!content) {
    throw new HttpsError('invalid-argument', 'Comment content cannot be empty.');
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    throw new HttpsError('invalid-argument', `Comment exceeds max length of ${MAX_COMMENT_LENGTH} characters.`);
  }

  const db = admin.firestore();
  const postRef = db.collection('posts').doc(data.postId);
  const postSnap = await postRef.get();

  if (!postSnap.exists) {
    throw new HttpsError('not-found', 'Post not found.');
  }

  const postData = postSnap.data() || {};
  if (postData.isHidden) {
    throw new HttpsError('failed-precondition', 'Cannot comment on a hidden post.');
  }

  const commentRef = db.collection('comments').doc();
  const commentId = commentRef.id;

  // Use same thread pseudonym for consistency within the post
  const pseudonym = generatePostPseudonym(uid, data.postId);

  let displayName: string | null = null;
  let authorProfileId: string | null = null;

  if (data.identity === 'identified') {
    authorProfileId = uid;
    const profileSnap = await db.collection('profiles').doc(uid).get();
    if (profileSnap.exists) {
      displayName = profileSnap.data()?.displayName || null;
    }
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    // 1. Private comment author mapping
    const authorRef = db.collection('commentAuthors').doc(commentId);
    transaction.set(authorRef, {
      uid,
      postId: data.postId,
      createdAt: now,
    });

    // 2. Public comment doc (NO authorUid)
    transaction.set(commentRef, {
      postId: data.postId,
      identity: data.identity,
      pseudonym,
      authorProfileId,
      displayName,
      content,
      upvotes: 0,
      downvotes: 0,
      createdAt: now,
      parentCommentId: data.parentCommentId || null,
    });

    // 3. Increment commentCount on post
    transaction.update(postRef, {
      commentCount: admin.firestore.FieldValue.increment(1),
    });
  });

  // Handle Notifications asynchronously
  try {
    let targetUid: string | null = null;
    let notifType: 'comment' | 'reply' = 'comment';

    if (data.parentCommentId) {
      // Replying to a specific comment
      const parentAuthorSnap = await db.collection('commentAuthors').doc(data.parentCommentId).get();
      if (parentAuthorSnap.exists) {
        targetUid = parentAuthorSnap.data()?.uid;
        notifType = 'reply';
      }
    } else {
      // Replying to the post
      const postAuthorSnap = await db.collection('postAuthors').doc(data.postId).get();
      if (postAuthorSnap.exists) {
        targetUid = postAuthorSnap.data()?.uid;
      }
    }

    // Only notify if author is not commenting on their own content
    if (targetUid && targetUid !== uid) {
      const actorLabel = data.identity === 'identified' && displayName ? displayName : pseudonym;
      const message = notifType === 'reply'
        ? `@${actorLabel} replied to your comment: "${content.slice(0, 50)}"`
        : `@${actorLabel} commented on your post: "${content.slice(0, 50)}"`;

      await db.collection('notifications').add({
        recipientUid: targetUid,
        type: notifType,
        message,
        postId: data.postId,
        postPreview: postData.content ? postData.content.slice(0, 60) : null,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('Error dispatching comment notification:', err);
  }

  return { commentId, pseudonym };
});
