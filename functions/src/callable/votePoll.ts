import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface VotePollData {
  postId: string;
  optionIndex: number;
}

export const votePoll = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to vote on a poll.');
  }

  const { uid, token } = request.auth;
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!token.email_verified && !isEmulated) {
    throw new HttpsError('permission-denied', 'University email must be verified to vote.');
  }

  const { postId, optionIndex } = request.data as VotePollData;

  if (!postId || typeof optionIndex !== 'number' || optionIndex < 0) {
    throw new HttpsError('invalid-argument', 'Valid postId and optionIndex are required.');
  }

  const db = admin.firestore();
  const postRef = db.collection('posts').doc(postId);
  const voteRef = postRef.collection('pollVotes').doc(uid);

  await db.runTransaction(async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists) {
      throw new HttpsError('not-found', 'Post not found.');
    }

    const postData = postSnap.data() || {};
    const poll = postData.poll;
    if (!poll || !Array.isArray(poll.options)) {
      throw new HttpsError('failed-precondition', 'Post has no active poll.');
    }

    if (optionIndex >= poll.options.length) {
      throw new HttpsError('invalid-argument', 'Selected option index out of range.');
    }

    // Check expiration
    if (poll.endsAt && poll.endsAt.toMillis() < Date.now()) {
      throw new HttpsError('failed-precondition', 'This poll has ended.');
    }

    // Check if user already voted
    const existingVote = await transaction.get(voteRef);
    if (existingVote.exists) {
      throw new HttpsError('already-exists', 'You have already voted in this poll.');
    }

    // Record private vote in subcollection
    transaction.set(voteRef, {
      optionIndex,
      votedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment public counter on post doc (no user ID stored on post)
    transaction.update(postRef, {
      [`poll.votes.${optionIndex}`]: admin.firestore.FieldValue.increment(1),
    });
  });

  return { success: true, optionIndex };
});
