import { user as authUser } from 'firebase-functions/v1/auth';
import * as admin from 'firebase-admin';
import { generatePermanentPseudonym } from '../utils/pseudonym';

export const onUserCreate = authUser().onCreate(async (user) => {
  const db = admin.firestore();
  const uid = user.uid;
  const email = user.email || '';
  const now = admin.firestore.FieldValue.serverTimestamp();

  const pseudonym = generatePermanentPseudonym(uid);

  const batch = db.batch();

  // 1. Private User Document (Strictly owner-only)
  const userRef = db.collection('users').doc(uid);
  batch.set(userRef, {
    uid,
    email,
    pseudonym,
    currentStreak: 0,
    longestStreak: 0,
    postCount: 0,
    upvotesReceived: 0,
    isModerator: false,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Public Profile Document (Publicly readable)
  const profileRef = db.collection('profiles').doc(uid);
  batch.set(profileRef, {
    displayName: user.displayName || null,
    avatarUrl: user.photoURL || null,
    createdAt: now,
  });

  await batch.commit();
});
