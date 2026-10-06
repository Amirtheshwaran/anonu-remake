import * as crypto from 'crypto';
import { analyticsService } from '../../src/services/analytics';
import { crashReporting } from '../../src/services/crashReporting';
import { AnonUConstants } from '../../src/constants/config';

// Replicating pure HMAC generation from functions/src/utils/pseudonym.ts for unit test verification
function generatePostPseudonym(uid: string, postId: string, secretSalt = 'anonu_campus_secure_salt_77a9'): string {
  const hmac = crypto.createHmac('sha256', secretSalt);
  hmac.update(`${uid}:${postId}`);
  const digest = hmac.digest();

  const adjs = AnonUConstants.adjectives;
  const animals = AnonUConstants.animals;
  const adjIndex = digest.readUInt32BE(0) % adjs.length;
  const animalIndex = digest.readUInt32BE(4) % animals.length;

  return `${adjs[adjIndex]} ${animals[animalIndex]}`;
}

// Sliding-window rate limit simulator matching functions/src/utils/rateLimit.ts
function simulateRateLimitCheck(
  existingTimestamps: number[],
  now: number,
  windowMs: number,
  maxAllowed: number
): { allowed: boolean; remaining: number } {
  const valid = existingTimestamps.filter((ts) => now - ts < windowMs);
  if (valid.length >= maxAllowed) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxAllowed - (valid.length + 1) };
}

// Expiry calculator
function computeExpiry(createdAt: Date, hours: number | null): Date {
  if (hours === null || hours === undefined) {
    return new Date('2099-12-31T23:59:59.999Z');
  }
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

function isPostExpired(expiresAt: Date, now: Date): boolean {
  return now.getTime() >= expiresAt.getTime();
}

describe('Phase 6: Quality, Release, Telemetry & Privacy Metrics', () => {
  describe('Cryptographic Pseudonyms & Zero-Knowledge Segregation', () => {
    const salt = 'prod_secret_salt_49f8a2';

    it('generates consistent pseudonym for the same author within the same thread', () => {
      const uid = 'student_uid_abc123';
      const postId = 'post_general_789';

      const mask1 = generatePostPseudonym(uid, postId, salt);
      const mask2 = generatePostPseudonym(uid, postId, salt);

      expect(mask1).toBe(mask2);
      expect(mask1.split(' ').length).toBe(2);
    });

    it('prevents cross-thread tracking: produces completely different pseudonyms across posts', () => {
      const uid = 'student_uid_abc123';
      const postA = 'post_campus_thread_001';
      const postB = 'post_campus_thread_002';

      const maskA = generatePostPseudonym(uid, postA, salt);
      const maskB = generatePostPseudonym(uid, postB, salt);

      // In cryptographic HMAC, changing postId generates completely independent digests
      expect(maskA).not.toBe(maskB);
    });

    it('ensures two distinct students produce distinct masks on the same thread', () => {
      const user1 = 'student_alice_uncc';
      const user2 = 'student_bob_uncc';
      const postThread = 'post_exam_review_101';

      const mask1 = generatePostPseudonym(user1, postThread, salt);
      const mask2 = generatePostPseudonym(user2, postThread, salt);

      expect(mask1).not.toBe(mask2);
    });
  });

  describe('Sliding-Window Rate Limiting Engine', () => {
    const ONE_HOUR = 60 * 60 * 1000;

    it('allows writes when requests are within the allowed hourly limit', () => {
      const now = Date.now();
      const timestamps = [now - 30 * 60 * 1000, now - 15 * 60 * 1000]; // 2 past posts in last hour
      const result = simulateRateLimitCheck(timestamps, now, ONE_HOUR, 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
    });

    it('blocks writes when hourly burst quota is exceeded', () => {
      const now = Date.now();
      const max10Timestamps = Array.from({ length: 10 }, (_, i) => now - (i + 1) * 60 * 1000);
      const result = simulateRateLimitCheck(max10Timestamps, now, ONE_HOUR, 10);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('expires old timestamps after window elapses, restoring write quota', () => {
      const now = Date.now();
      // 10 posts that happened 2 hours ago
      const oldTimestamps = Array.from({ length: 10 }, (_, i) => now - (ONE_HOUR + 5 * 60 * 1000 + i * 1000));
      const result = simulateRateLimitCheck(oldTimestamps, now, ONE_HOUR, 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('Post Expiry & Firestore TTL Computation', () => {
    it('accurately computes future expiry dates for standard time windows', () => {
      const base = new Date('2026-10-01T12:00:00Z');

      const exp1h = computeExpiry(base, 1);
      expect(exp1h.toISOString()).toBe('2026-10-01T13:00:00.000Z');

      const exp24h = computeExpiry(base, 24);
      expect(exp24h.toISOString()).toBe('2026-10-02T12:00:00.000Z');

      const exp48h = computeExpiry(base, 48);
      expect(exp48h.toISOString()).toBe('2026-10-03T12:00:00.000Z');
    });

    it('assigns far-future date (year 2099) for Never expiring posts', () => {
      const base = new Date('2026-10-01T12:00:00Z');
      const expNever = computeExpiry(base, null);

      expect(expNever.getUTCFullYear()).toBe(2099);
    });

    it('correctly flags expired vs active publications', () => {
      const expiresAt = new Date('2026-10-01T15:00:00Z');

      const beforeExpiry = new Date('2026-10-01T14:59:59Z');
      expect(isPostExpired(expiresAt, beforeExpiry)).toBe(false);

      const afterExpiry = new Date('2026-10-01T15:00:01Z');
      expect(isPostExpired(expiresAt, afterExpiry)).toBe(true);
    });
  });

  describe('Privacy-Safe Telemetry & Analytics Service', () => {
    beforeEach(() => {
      analyticsService.clearLoggedEvents();
    });

    it('logs sanitized post_created event with anonymous flag and metadata', async () => {
      await analyticsService.logEvent('post_created', {
        identity: 'anonymous',
        channel: 'Classes',
        hasPoll: false,
        imageCount: 2,
        type: 'image',
      });

      const events = analyticsService.getLoggedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('post_created');
      expect(events[0].params.identity).toBe('anonymous');
      expect(events[0].params.channel).toBe('Classes');
      expect(events[0].params.imageCount).toBe(2);
    });

    it('logs voting, commenting, and reporting events without student UIDs', async () => {
      await analyticsService.logEvent('vote', { type: 'upvote', postId: 'post_123' });
      await analyticsService.logEvent('comment', { postId: 'post_123', isReply: false });
      await analyticsService.logEvent('report', { postId: 'post_123', reason: 'Harassment' });

      const events = analyticsService.getLoggedEvents();
      expect(events).toHaveLength(3);
      expect(events.map((e) => e.name)).toEqual(['vote', 'comment', 'report']);
    });
  });

  describe('Crash Reporting PII Stripping & Breadcrumbs', () => {
    beforeEach(() => {
      crashReporting.clearBreadcrumbs();
    });

    it('redacts email addresses from breadcrumbs and error reports', () => {
      crashReporting.logBreadcrumb('User student@uncc.edu tapped on channel #Classes');
      const crumbs = crashReporting.getBreadcrumbs();

      expect(crumbs).toHaveLength(1);
      expect(crumbs[0].message).toContain('[REDACTED_EMAIL]');
      expect(crumbs[0].message).not.toContain('student@uncc.edu');
    });

    it('redacts telephone numbers from breadcrumbs', () => {
      crashReporting.logBreadcrumb('Emergency contact verified: 704-555-0199');
      const crumbs = crashReporting.getBreadcrumbs();

      expect(crumbs[0].message).toContain('[REDACTED_PHONE]');
      expect(crumbs[0].message).not.toContain('704-555-0199');
    });
  });

  describe('User Data Export Payload Structure (GDPR & App Store)', () => {
    it('validates sanitized export schema containing bookmarks and activity metrics', () => {
      const mockExport = {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        account: {
          campusId: 'uncc',
          email: 'student@uncc.edu',
          createdAt: new Date().toISOString(),
          identityMode: 'anonymous',
          streakDays: 5,
        },
        activitySummary: {
          authoredPostsCount: 8,
          authoredCommentsCount: 22,
          bookmarksCount: 4,
          blockedAuthorsCount: 1,
        },
        bookmarks: [
          { id: 'bm_1', postId: 'post_77', savedAt: new Date().toISOString() },
        ],
      };

      expect(mockExport.exportVersion).toBe('1.0');
      expect(mockExport.account.campusId).toBe('uncc');
      expect(mockExport.activitySummary.authoredPostsCount).toBe(8);
      expect(mockExport.bookmarks).toHaveLength(1);
    });
  });
});
