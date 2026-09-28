import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface ResolveReportData {
  reportId: string;
  action: 'dismiss' | 'hide' | 'restore' | 'strike';
  postId?: string;
  reason?: string;
}

export const resolveReport = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { uid, token } = request.auth;
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  const db = admin.firestore();

  // Enforce custom claim
  const isModerator = Boolean(token.isModerator || token.moderator);
  if (!isModerator && !isEmulated) {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.data()?.isModerator) {
      throw new HttpsError('permission-denied', 'Only campus moderators can resolve incident reports.');
    }
  }

  const data: ResolveReportData = request.data as ResolveReportData;
  const { reportId, action, postId, reason } = data;

  if (!reportId || !action) {
    throw new HttpsError('invalid-argument', 'Missing reportId or action.');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const reportRef = db.collection('reports').doc(reportId);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) {
    throw new HttpsError('not-found', 'Report not found.');
  }

  const targetPostId = postId || reportSnap.data()?.postId;
  let targetAuthorUid: string | null = null;

  if (targetPostId) {
    const authorSnap = await db.collection('postAuthors').doc(targetPostId).get();
    if (authorSnap.exists) {
      targetAuthorUid = authorSnap.data()?.uid || null;
    }
  }

  // 1. Execute action
  let strikeDetails: any = null;

  if (action === 'hide' && targetPostId) {
    await db.collection('posts').doc(targetPostId).update({
      isHidden: true,
      hiddenAt: now,
      hiddenReason: reason || 'Moderator action',
    });
  } else if (action === 'restore' && targetPostId) {
    await db.collection('posts').doc(targetPostId).update({
      isHidden: false,
      restoredAt: now,
    });
  } else if (action === 'strike' && targetAuthorUid) {
    // Hide the post
    if (targetPostId) {
      await db.collection('posts').doc(targetPostId).update({
        isHidden: true,
        hiddenAt: now,
        hiddenReason: reason || 'Policy strike issued',
      });
    }

    // Add strike record to user
    const strikeRef = db.collection('users').doc(targetAuthorUid).collection('strikes').doc();
    const strikeId = strikeRef.id;

    const userRef = db.collection('users').doc(targetAuthorUid);
    const userSnap = await userRef.get();
    const currentStrikes = (userSnap.data()?.strikeCount || 0) + 1;

    let timeoutUntil: Date | null = null;
    let isBanned = false;

    if (currentStrikes === 2) {
      // 24 hour timeout
      timeoutUntil = new Date(Date.now() + 24 * 3600 * 1000);
    } else if (currentStrikes === 3) {
      // 7 day timeout
      timeoutUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    } else if (currentStrikes >= 4) {
      isBanned = true;
    }

    const strikeData = {
      id: strikeId,
      reportId,
      postId: targetPostId || null,
      reason: reason || 'Community rules violation',
      strikeNumber: currentStrikes,
      moderatorUid: uid,
      issuedAt: now,
    };

    await strikeRef.set(strikeData);

    const userUpdates: Record<string, any> = {
      strikeCount: currentStrikes,
      updatedAt: now,
    };

    if (timeoutUntil) {
      userUpdates.timeoutUntil = admin.firestore.Timestamp.fromDate(timeoutUntil);
    }
    if (isBanned) {
      userUpdates.isBanned = true;
    }

    await userRef.update(userUpdates);

    strikeDetails = {
      strikeNumber: currentStrikes,
      timeoutUntil: timeoutUntil?.toISOString() || null,
      isBanned,
    };
  }

  // 2. Mark report status
  await reportRef.set(
    {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      resolvedAction: action,
      resolvedBy: uid,
      resolvedReason: reason || null,
      resolvedAt: now,
    },
    { merge: true }
  );

  // 3. Record Audit Log Entry
  await db.collection('moderatorAuditLog').add({
    moderatorUid: uid,
    action,
    reportId,
    postId: targetPostId || null,
    targetAuthorUid: targetAuthorUid || null,
    reason: reason || null,
    timestamp: now,
  });

  return { success: true, action, strikeDetails };
});
