import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface CheckInMoodData {
  mood: string;
}

export const checkInMood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { uid, token } = request.auth;
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!token.email_verified && !isEmulated) {
    throw new HttpsError('permission-denied', 'University email must be verified to check in.');
  }

  const data: CheckInMoodData = request.data;
  const mood = (data.mood || '').trim();
  if (!mood) {
    throw new HttpsError('invalid-argument', 'Mood cannot be empty.');
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 1;
  let longestStreak = 1;

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() || {};

    const lastMoodDate = userData.lastMoodDate as string | undefined;
    const oldCurrent = (userData.currentStreak as number) || 0;
    const oldLongest = (userData.longestStreak as number) || 0;

    if (lastMoodDate === todayStr) {
      // Already checked in today: keep streak
      currentStreak = oldCurrent;
      longestStreak = oldLongest;
    } else if (lastMoodDate === yesterdayStr) {
      // Consecutive day: increment streak
      currentStreak = oldCurrent + 1;
      longestStreak = Math.max(oldLongest, currentStreak);
    } else {
      // Reset streak
      currentStreak = 1;
      longestStreak = Math.max(oldLongest, 1);
    }

    const campusId = userData.campusId || 'uncc';

    // 1. Update user's private document
    transaction.set(
      userRef,
      {
        lastMood: mood,
        lastMoodDate: todayStr,
        currentStreak,
        longestStreak,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Increment aggregated daily count (anonymous aggregate counter scoped by campus)
    const dailyRef = db.collection('moodDaily').doc(`${campusId}_${todayStr}`);
    transaction.set(
      dailyRef,
      {
        campusId,
        date: todayStr,
        [`counts.${mood}`]: admin.firestore.FieldValue.increment(1),
        totalCheckins: admin.firestore.FieldValue.increment(1),
      },
      { merge: true }
    );

    // 3. Increment live mood counter scoped by campus
    const liveRef = db.collection('moodLive').doc(campusId);
    transaction.set(
      liveRef,
      {
        campusId,
        [`counts.${mood}`]: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Legacy fallback doc for backwards compatibility
    const fallbackRef = db.collection('moodLive').doc('current');
    transaction.set(
      fallbackRef,
      {
        [`counts.${mood}`]: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return { success: true, currentStreak, longestStreak };
});
