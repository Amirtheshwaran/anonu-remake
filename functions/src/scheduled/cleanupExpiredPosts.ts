import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const cleanupExpiredPosts = onSchedule('every 1 hours', async () => {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const now = admin.firestore.Timestamp.now();

  const expiredQuery = await db
    .collection('posts')
    .where('expiresAt', '<=', now)
    .where('isHidden', '==', false)
    .limit(100)
    .get();

  if (expiredQuery.empty) return;

  const batch = db.batch();

  for (const doc of expiredQuery.docs) {
    const postId = doc.id;
    const postData = doc.data();

    // 1. Mark as hidden/expired
    batch.update(doc.ref, {
      isHidden: true,
      expiredAt: now,
    });

    // 2. Delete attached images from Firebase Storage
    if (Array.isArray(postData.imageUrls) && postData.imageUrls.length > 0) {
      try {
        await bucket.deleteFiles({
          prefix: `postImages/${postId}/`,
        });
      } catch (err) {
        console.error(`Failed to delete images for expired post ${postId}:`, err);
      }
    }
  }

  await batch.commit();
});
