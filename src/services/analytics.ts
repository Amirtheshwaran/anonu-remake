/**
 * AnonU Privacy-Preserving Telemetry & Analytics Service
 * Never logs user PII, email addresses, or unmasked student identities.
 */

export interface AnalyticsEventParams {
  sign_up: { campusId: string; method?: string };
  post_created: {
    identity: 'anonymous' | 'identified';
    channel: string;
    hasPoll: boolean;
    imageCount: number;
    type: 'text' | 'image' | 'poll' | 'event';
  };
  vote: { type: 'upvote' | 'downvote'; postId: string };
  comment: { postId: string; isReply: boolean };
  report: { postId: string; reason: string };
  block: { targetIdentity: 'anonymous' | 'identified' };
  mood_checkin: { moodValue: number };
  channel_view: { channelId: string };
  bookmark: { postId: string; action: 'add' | 'remove' };
  rsvp: { postId: string; action: 'rsvp' | 'cancel' };
  account_deleted: { campusId?: string };
}

type EventName = keyof AnalyticsEventParams;

class AnalyticsService {
  private enabled: boolean = true;
  private logSink: Array<{ name: string; params: any; timestamp: number }> = [];

  constructor() {
    this.enabled = process.env.NODE_ENV !== 'test';
  }

  /**
   * Log a privacy-sanitized analytics event
   */
  async logEvent<K extends EventName>(
    eventName: K,
    params: AnalyticsEventParams[K]
  ): Promise<void> {
    if (!this.enabled) {
      this.logSink.push({ name: eventName, params, timestamp: Date.now() });
      return;
    }

    try {
      // In production with native Firebase linked:
      // const analytics = require('@react-native-firebase/analytics').default;
      // await analytics().logEvent(eventName, params);

      this.logSink.push({ name: eventName, params, timestamp: Date.now() });
      if (__DEV__) {
        console.log(`[Analytics] ${eventName}:`, params);
      }
    } catch (err) {
      console.warn(`[Analytics] Failed to track ${eventName}:`, err);
    }
  }

  /**
   * Set user campus property (isolated, no PII)
   */
  async setUserCampus(campusId: string): Promise<void> {
    try {
      if (__DEV__) {
        console.log(`[Analytics] User Campus set to: ${campusId}`);
      }
    } catch (err) {
      console.warn('[Analytics] Failed to set campus property:', err);
    }
  }

  /**
   * Returns recent logged events for inspection & tests
   */
  getLoggedEvents() {
    return [...this.logSink];
  }

  /**
   * Clear in-memory event sink
   */
  clearLoggedEvents() {
    this.logSink = [];
  }
}

export const analyticsService = new AnalyticsService();
