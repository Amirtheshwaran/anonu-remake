import { calculateHotScore } from '../../functions/src/utils/decay';
import { useOutboxStore, QueuedPost } from '../../src/stores/useOutboxStore';

describe('Phase 3: Feed Quality, Hot Decay & Outbox Resilience', () => {
  describe('Hacker News Gravity Decay Algorithm', () => {
    it('calculates expected hot scores immediately after creation (age = 0h)', () => {
      const now = new Date();
      // formula: 10 / (2 ^ 1.5) = 10 / 2.8284 = 3.5355
      const score = calculateHotScore(10, now, 1.5);
      expect(score).toBeCloseTo(3.5355, 3);
    });

    it('decays score over 6, 12, and 24 hours', () => {
      const now = Date.now();
      const h6Ago = new Date(now - 6 * 3600 * 1000);
      const h12Ago = new Date(now - 12 * 3600 * 1000);
      const h24Ago = new Date(now - 24 * 3600 * 1000);

      const score0h = calculateHotScore(10, new Date(now));
      const score6h = calculateHotScore(10, h6Ago);
      const score12h = calculateHotScore(10, h12Ago);
      const score24h = calculateHotScore(10, h24Ago);

      // Score must strictly monotonically decrease as age increases
      expect(score0h).toBeGreaterThan(score6h);
      expect(score6h).toBeGreaterThan(score12h);
      expect(score12h).toBeGreaterThan(score24h);

      expect(score6h).toBeCloseTo(0.4419, 3);
      expect(score24h).toBeCloseTo(0.0754, 3);
    });

    it('surfaces fresh 5-vote post over a 24-hour-old 20-vote post', () => {
      const now = Date.now();
      const freshPostCreatedAt = new Date(now - 1 * 3600 * 1000); // 1 hour old, 5 votes
      const oldPostCreatedAt = new Date(now - 24 * 3600 * 1000); // 24 hours old, 20 votes

      const freshPostHotScore = calculateHotScore(5, freshPostCreatedAt); // 5 / (3 ^ 1.5) = 5 / 5.196 = 0.962
      const oldPostHotScore = calculateHotScore(20, oldPostCreatedAt); // 20 / (26 ^ 1.5) = 20 / 132.57 = 0.151

      expect(freshPostHotScore).toBeGreaterThan(oldPostHotScore);
    });

    it('handles negative or zero scores gracefully without NaN', () => {
      const now = new Date();
      expect(calculateHotScore(0, now)).toBe(0);
      expect(calculateHotScore(-5, now)).toBeLessThan(0);
      expect(isNaN(calculateHotScore(-5, now))).toBe(false);
    });

    it('higher gravity increases decay speed', () => {
      const h4Ago = new Date(Date.now() - 4 * 3600 * 1000);
      const lowGravityScore = calculateHotScore(10, h4Ago, 1.2);
      const highGravityScore = calculateHotScore(10, h4Ago, 1.8);

      expect(lowGravityScore).toBeGreaterThan(highGravityScore);
    });
  });

  describe('Offline Outbox Queue', () => {
    beforeEach(() => {
      useOutboxStore.getState().clear();
    });

    it('enqueues publications with queued status and unique id', () => {
      const id = useOutboxStore.getState().enqueue({
        content: 'Offline test publication from campus basement',
        identity: 'anonymous',
        type: 'text',
        tags: ['study'],
        imageUrls: [],
      });

      const queue = useOutboxStore.getState().queue;
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe(id);
      expect(queue[0].status).toBe('queued');
      expect(queue[0].content).toContain('Offline test publication');
    });

    it('processes queued posts and removes them on success', async () => {
      useOutboxStore.getState().enqueue({
        content: 'Post 1',
        identity: 'anonymous',
        type: 'text',
        tags: [],
        imageUrls: [],
      });

      const mockPublish = jest.fn().mockResolvedValue({ id: 'new_post_123' });

      const result = await useOutboxStore.getState().processQueue(mockPublish);

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockPublish).toHaveBeenCalledTimes(1);
      expect(useOutboxStore.getState().queue.length).toBe(0);
    });

    it('marks post as failed on network error and allows retry', async () => {
      const id = useOutboxStore.getState().enqueue({
        content: 'Failing post',
        identity: 'anonymous',
        type: 'text',
        tags: [],
        imageUrls: [],
      });

      const mockFailingPublish = jest.fn().mockRejectedValue(new Error('Network offline'));

      const result = await useOutboxStore.getState().processQueue(mockFailingPublish);

      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);

      const item = useOutboxStore.getState().queue[0];
      expect(item.status).toBe('failed');
      expect(item.error).toBe('Network offline');

      // Retry
      useOutboxStore.getState().retry(id);
      expect(useOutboxStore.getState().queue[0].status).toBe('queued');
      expect(useOutboxStore.getState().queue[0].error).toBeUndefined();
    });
  });
});
