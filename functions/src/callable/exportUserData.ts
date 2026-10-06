import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

/**
 * Callable function to export user's private data package (GDPR & App Store compliance)
 */
export const exportUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to export data.');
  }

  const uid = request.auth.uid;
  const db = admin.firestore();

  // 1. Fetch private user document
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User record not found.');
  }
  const userData = userSnap.data() || {};

  // 2. Fetch bookmarks
  const bookmarksSnap = await db.collection('users').doc(uid).collection('bookmarks').get();
  const bookmarks = bookmarksSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // 3. Fetch blocked authors list
  const blockedSnap = await db.collection('users').doc(uid).collection('blockedAuthors').get();
  const blockedAuthors = blockedSnap.docs.map((doc) => doc.id);

  // 4. Fetch authored publications count
  const postAuthorsSnap = await db.collection('postAuthors').where('uid', '==', uid).get();
  const commentAuthorsSnap = await db.collection('commentAuthors').where('uid', '==', uid).get();

  return {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    account: {
      campusId: userData.campusId || null,
      email: userData.email || null,
      createdAt: userData.createdAt || null,
      identityMode: userData.identityMode || 'anonymous',
      streakDays: userData.streakDays || 0,
    },
    activitySummary: {
      authoredPostsCount: postAuthorsSnap.size,
      authoredCommentsCount: commentAuthorsSnap.size,
      bookmarksCount: bookmarks.length,
      blockedAuthorsCount: blockedAuthors.length,
    },
    bookmarks,
  };
});
