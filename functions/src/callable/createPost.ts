import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { MAX_POST_LENGTH, MAX_TAGS, MAX_IMAGES, MAX_POLL_OPTIONS } from '../constants';
import { generatePostPseudonym } from '../utils/pseudonym';
import { checkRateLimit } from '../utils/rateLimit';
import { getCampusByEmail } from '../utils/campus';
import { screenContent } from '../utils/moderation';

interface CreatePostData {
  content: string;
  identity: 'anonymous' | 'identified';
  type: 'text' | 'poll' | 'image' | 'event';
  channel?: string;
  tags?: string[];
  imageUrls?: string[];
  poll?: {
    options: string[];
    durationHours?: number;
  };
  eventData?: {
    title: string;
    eventTime: string | number;
    location: string;
  };
  timeLimitHours?: number | null;
}

export const createPost = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to post.');
  }

  const { uid, token } = request.auth;

  // Enforce email verification (allow bypass in test/emulator if specified)
  const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!token.email_verified && !isEmulated) {
    throw new HttpsError('permission-denied', 'University email must be verified before posting.');
  }

  // Rate limit: 10 posts per hour
  await checkRateLimit(uid, 'post', 10);

  const data: CreatePostData = request.data;
  const content = (data.content || '').trim();

  if (!content) {
    throw new HttpsError('invalid-argument', 'Post content cannot be empty.');
  }
  if (content.length > MAX_POST_LENGTH) {
    throw new HttpsError('invalid-argument', `Post exceeds max length of ${MAX_POST_LENGTH} characters.`);
  }

  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data() || {};

  // Check strike penalties: Ban or Timeout
  if (userData.isBanned) {
    throw new HttpsError(
      'permission-denied',
      'Your account has been permanently suspended for repeated policy violations.'
    );
  }

  if (userData.timeoutUntil) {
    const timeoutDate = userData.timeoutUntil.toDate
      ? userData.timeoutUntil.toDate()
      : new Date(userData.timeoutUntil);
    if (timeoutDate > new Date()) {
      throw new HttpsError(
        'permission-denied',
        `Your posting privileges are suspended until ${timeoutDate.toLocaleString()} due to active strikes.`
      );
    }
  }

  // Verify onboarding and rules acceptance
  if (!userData.rulesAcceptedAt && !isEmulated) {
    throw new HttpsError('failed-precondition', 'Community rules must be accepted before posting.');
  }

  // Run automated screening (PII regex, crisis signals, toxicity)
  const screening = screenContent(content);
  const isHidden = screening.action === 'auto_hide';

  // Derive or extract campusId
  let campusId = userData.campusId;
  if (!campusId && token.email) {
    const campus = getCampusByEmail(token.email);
    campusId = campus ? campus.campusId : 'uncc';
  }
  if (!campusId) {
    campusId = 'uncc';
  }

  const tags = (data.tags || []).slice(0, MAX_TAGS).map((t) => t.toLowerCase().trim().replace(/^#/, ''));
  const imageUrls = (data.imageUrls || []).slice(0, MAX_IMAGES);

  // Validate Poll
  let pollData = null;
  if (data.type === 'poll' && data.poll) {
    const options = (data.poll.options || [])
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (options.length < 2 || options.length > MAX_POLL_OPTIONS) {
      throw new HttpsError('invalid-argument', 'Poll must have between 2 and 4 options.');
    }

    const durationHours = data.poll.durationHours || 24;
    const endsAt = new Date(Date.now() + durationHours * 3600 * 1000);

    const initialVotes: Record<string, number> = {};
    options.forEach((_, idx) => {
      initialVotes[idx.toString()] = 0;
    });

    pollData = {
      options,
      votes: initialVotes,
      endsAt: admin.firestore.Timestamp.fromDate(endsAt),
    };
  }

  const allowedChannels = ['General', 'Classes', 'Housing', 'Marketplace', 'Events', 'LostAndFound'];
  const channel = data.channel && allowedChannels.includes(data.channel) ? data.channel : 'General';

  // Validate Event
  let eventData = null;
  if (data.type === 'event') {
    if (data.identity !== 'identified') {
      throw new HttpsError(
        'invalid-argument',
        'Campus events must be published under your verified identity to prevent fraudulent assemblies.'
      );
    }
    if (!data.eventData || !data.eventData.title?.trim() || !data.eventData.location?.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'Event posts must include a title, event date/time, and campus location.'
      );
    }

    const eventDate = new Date(data.eventData.eventTime);
    if (isNaN(eventDate.getTime())) {
      throw new HttpsError('invalid-argument', 'Invalid event date/time format.');
    }

    eventData = {
      title: data.eventData.title.trim().slice(0, 100),
      eventTime: admin.firestore.Timestamp.fromDate(eventDate),
      location: data.eventData.location.trim().slice(0, 100),
      rsvpCount: 0,
    };
  }

  // Calculate Expiration
  let expiresAt = null;
  if (data.timeLimitHours && data.timeLimitHours > 0) {
    expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + data.timeLimitHours * 3600 * 1000)
    );
  }

  const postRef = db.collection('posts').doc();
  const postId = postRef.id;

  // Generate deterministic pseudonym for this thread
  const pseudonym = generatePostPseudonym(uid, postId);

  // Handle identified profile
  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let authorProfileId: string | null = null;

  if (data.identity === 'identified') {
    authorProfileId = uid;
    const profileSnap = await db.collection('profiles').doc(uid).get();
    if (profileSnap.exists) {
      const pData = profileSnap.data() || {};
      displayName = pData.displayName || null;
      avatarUrl = pData.avatarUrl || null;
    }
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Transaction: write private author mapping and public post document
  await db.runTransaction(async (transaction) => {
    // 1. Private author mapping (restricted to Admin/Functions)
    const authorRef = db.collection('postAuthors').doc(postId);
    transaction.set(authorRef, {
      uid,
      campusId,
      createdAt: now,
    });

    // 2. Public post document (NO authorUid)
    transaction.set(postRef, {
      campusId,
      channel,
      identity: data.identity,
      pseudonym,
      authorProfileId,
      displayName,
      avatarUrl,
      content,
      type: data.type,
      tags,
      imageUrls,
      poll: pollData,
      eventData,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      hotScore: 0,
      commentCount: 0,
      repostCount: 0,
      createdAt: now,
      expiresAt,
      isHidden,
      isRepost: false,
      moderationSeverity: screening.severity,
      moderationReason: screening.flagReason || null,
    });

    // 3. Increment author's post count in private user document
    const userRef = db.collection('users').doc(uid);
    transaction.set(
      userRef,
      {
        postCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );
  });

  // 4. If flagged or crisis, enqueue report for moderators
  if (screening.action !== 'publish' || screening.isCrisis) {
    await db.collection('reports').add({
      postId,
      campusId,
      reason: screening.flagReason || (screening.isCrisis ? 'Crisis Signal' : 'Automated Policy Match'),
      severity: screening.severity,
      status: 'pending',
      screeningScores: screening.toxicityScores,
      createdAt: now,
    });
  }

  return {
    postId,
    pseudonym,
    campusId,
    isHidden,
    isCrisis: screening.isCrisis,
    supportResources: screening.isCrisis
      ? {
          lifeline: '988 (Call or Text)',
          crisisTextLine: 'Text HOME to 741741',
          onlineChat: '988lifeline.org/chat',
          campusHealth: 'Student Health & Psychological Counseling Center',
        }
      : null,
  };
});
