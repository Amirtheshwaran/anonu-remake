import * as admin from 'firebase-admin';

export async function checkRateLimit(
  uid: string,
  action: 'post' | 'comment',
  maxPerHour: number
): Promise<void> {
  const db = admin.firestore();
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const rateLimitRef = db.collection('rateLimits').doc(`${uid}_${action}`);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitRef);
    if (!doc.exists) {
      transaction.set(rateLimitRef, {
        timestamps: [now],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const data = doc.data() || {};
    const timestamps: number[] = (data.timestamps || []).filter(
      (ts: number) => now - ts < windowMs
    );

    if (timestamps.length >= maxPerHour) {
      throw new Error(`Rate limit exceeded for ${action}. Max ${maxPerHour} per hour allowed.`);
    }

    timestamps.push(now);
    transaction.set(
      rateLimitRef,
      {
        timestamps,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}
