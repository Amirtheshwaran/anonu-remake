import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { AUTO_HIDE_THRESHOLD } from '../constants';
import { calculateHotScore } from '../utils/decay';

export const onVoteWrite = onDocumentWritten('posts/{postId}/votes/{userId}', async (event) => {
  const { postId, userId } = event.params;
  const beforeSnap = event.data?.before;
  const afterSnap = event.data?.after;

  const beforeVote: boolean | null = beforeSnap?.exists ? beforeSnap.data()?.vote : null;
  const afterVote: boolean | null = afterSnap?.exists ? afterSnap.data()?.vote : null;

  if (beforeVote === afterVote) return;

  let upvoteDelta = 0;
  let downvoteDelta = 0;

  if (beforeVote === true) upvoteDelta -= 1;
  if (beforeVote === false) downvoteDelta -= 1;

  if (afterVote === true) upvoteDelta += 1;
  if (afterVote === false) downvoteDelta += 1;

  const db = admin.firestore();
  const postRef = db.collection('posts').doc(postId);

  let authorUid: string | null = null;
  let postContent: string | null = null;

  await db.runTransaction(async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists) return;

    const data = postSnap.data() || {};
    postContent = data.content || null;

    const currentUpvotes = (data.upvotes || 0) + upvoteDelta;
    const currentDownvotes = (data.downvotes || 0) + downvoteDelta;
    const newScore = currentUpvotes - currentDownvotes;

    // Hot score calculation with gravity decay
    const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
    const hotScore = calculateHotScore(newScore, createdAt);

    const isHidden = data.isHidden || newScore <= AUTO_HIDE_THRESHOLD;

    transaction.update(postRef, {
      upvotes: Math.max(0, currentUpvotes),
      downvotes: Math.max(0, currentDownvotes),
      score: newScore,
      hotScore,
      isHidden,
    });
  });

  // Fetch author for user stats & notifications
  try {
    const authorSnap = await db.collection('postAuthors').doc(postId).get();
    if (authorSnap.exists) {
      authorUid = authorSnap.data()?.uid;
    }

    if (authorUid && upvoteDelta !== 0) {
      // Update author's cumulative upvote tally
      await db.collection('users').doc(authorUid).set(
        {
          upvotesReceived: admin.firestore.FieldValue.increment(upvoteDelta),
        },
        { merge: true }
      );

      // Safe notification if post received an upvote
      if (afterVote === true && authorUid !== userId) {
        await db.collection('notifications').add({
          recipientUid: authorUid,
          type: 'upvote',
          message: 'Someone on campus upvoted your publication.',
          postId,
          postPreview: postContent ? (postContent as string).slice(0, 60) : null,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.error('Error updating author upvote stats/notification:', err);
  }
});
