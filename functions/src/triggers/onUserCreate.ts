import { user as authUser } from 'firebase-functions/v1/auth';
import * as admin from 'firebase-admin';
import { generatePermanentPseudonym } from '../utils/pseudonym';
import { getCampusByEmail } from '../utils/campus';

export const onUserCreate = authUser().onCreate(async (user) => {
  const db = admin.firestore();
  const uid = user.uid;
  const email = user.email || '';
  const now = admin.firestore.FieldValue.serverTimestamp();

  const pseudonym = generatePermanentPseudonym(uid);
  const campus = getCampusByEmail(email);
  const campusId = campus ? campus.campusId : 'uncc'; // fallback default

  const batch = db.batch();

  // 1. Private User Document (Strictly owner-only)
  const userRef = db.collection('users').doc(uid);
  batch.set(userRef, {
    uid,
    email,
    campusId,
    pseudonym,
    currentStreak: 0,
    longestStreak: 0,
    postCount: 0,
    upvotesReceived: 0,
    isModerator: false,
    rulesAcceptedAt: null,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Public Profile Document (Publicly readable)
  const profileRef = db.collection('profiles').doc(uid);
  batch.set(profileRef, {
    displayName: user.displayName || null,
    avatarUrl: user.photoURL || null,
    campusId,
    createdAt: now,
  });

  await batch.commit();
});
