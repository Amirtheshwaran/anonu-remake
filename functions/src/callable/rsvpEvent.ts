import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface RsvpEventData {
  postId: string;
  isGoing: boolean;
}

export const rsvpEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in to RSVP for an event.');
  }

  const { uid } = request.auth;
  const { postId, isGoing }: RsvpEventData = request.data || {};

  if (!postId) {
    throw new HttpsError('invalid-argument', 'Missing postId.');
  }

  const db = admin.firestore();
  const postRef = db.collection('posts').doc(postId);
  const rsvpRef = postRef.collection('rsvps').doc(uid);

  let updatedRsvpCount = 0;

  await db.runTransaction(async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists) {
      throw new HttpsError('not-found', 'Event post not found.');
    }

    const postData = postSnap.data() || {};
    if (postData.type !== 'event' || !postData.eventData) {
      throw new HttpsError('invalid-argument', 'Target publication is not a campus event.');
    }

    const currentRsvpSnap = await transaction.get(rsvpRef);
    const currentlyGoing = currentRsvpSnap.exists;

    const currentCount = postData.eventData?.rsvpCount || 0;

    if (isGoing && !currentlyGoing) {
      // Add RSVP
      transaction.set(rsvpRef, {
        uid,
        isGoing: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      updatedRsvpCount = currentCount + 1;
      transaction.update(postRef, {
        'eventData.rsvpCount': updatedRsvpCount,
      });
    } else if (!isGoing && currentlyGoing) {
      // Remove RSVP
      transaction.delete(rsvpRef);

      updatedRsvpCount = Math.max(0, currentCount - 1);
      transaction.update(postRef, {
        'eventData.rsvpCount': updatedRsvpCount,
      });
    } else {
      updatedRsvpCount = currentCount;
    }
  });

  return {
    success: true,
    postId,
    isGoing,
    rsvpCount: updatedRsvpCount,
  };
});
