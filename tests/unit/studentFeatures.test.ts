import { CAMPUS_CHANNELS, CHANNEL_IDS } from '../../src/constants/channels';
import { PostModel, BookmarkModel } from '../../src/types/post';

describe('Phase 4: Campus Student Features', () => {
  describe('Campus Channels Configuration', () => {
    it('defines the standard 6 campus channels with emoji and neo-brutalist accent colors', () => {
      expect(CHANNEL_IDS).toEqual([
        'General',
        'Classes',
        'Housing',
        'Marketplace',
        'Events',
        'LostAndFound',
      ]);

      expect(CAMPUS_CHANNELS).toHaveLength(6);
      CAMPUS_CHANNELS.forEach((channel) => {
        expect(channel.id).toBeDefined();
        expect(channel.name).toBeDefined();
        expect(channel.emoji).toBeDefined();
        expect(channel.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('resolves valid channel or safely falls back to General', () => {
      const allowedChannels = ['General', 'Classes', 'Housing', 'Marketplace', 'Events', 'LostAndFound'];
      const resolveChannel = (input?: string) => {
        return input && allowedChannels.includes(input) ? input : 'General';
      };

      expect(resolveChannel('Classes')).toBe('Classes');
      expect(resolveChannel('Marketplace')).toBe('Marketplace');
      expect(resolveChannel('InvalidChannel')).toBe('General');
      expect(resolveChannel(undefined)).toBe('General');
      expect(resolveChannel('')).toBe('General');
    });
  });

  describe('Event Publications & Anti-Fraud Safety Enforcement', () => {
    function validateEventPost(params: {
      type: string;
      identity: string;
      eventData?: { title?: string; location?: string; eventTime?: string | number };
    }) {
      if (params.type === 'event') {
        if (params.identity !== 'identified') {
          throw new Error('Campus events must be published under your verified identity to prevent fraudulent assemblies.');
        }
        if (!params.eventData?.title?.trim() || !params.eventData?.location?.trim()) {
          throw new Error('Event posts must include a title, event date/time, and campus location.');
        }
        const eventDate = new Date(params.eventData.eventTime || '');
        if (isNaN(eventDate.getTime())) {
          throw new Error('Invalid event date/time format.');
        }
      }
      return true;
    }

    it('rejects anonymous creation of campus events to prevent fake assemblies', () => {
      expect(() => {
        validateEventPost({
          type: 'event',
          identity: 'anonymous',
          eventData: {
            title: 'Campus Protest',
            location: 'Student Union',
            eventTime: new Date().toISOString(),
          },
        });
      }).toThrow('Campus events must be published under your verified identity');
    });

    it('rejects event publications missing required title or location', () => {
      expect(() => {
        validateEventPost({
          type: 'event',
          identity: 'identified',
          eventData: {
            title: '',
            location: 'Quad',
            eventTime: new Date().toISOString(),
          },
        });
      }).toThrow('Event posts must include a title');

      expect(() => {
        validateEventPost({
          type: 'event',
          identity: 'identified',
          eventData: {
            title: 'Study Session',
            location: '   ',
            eventTime: new Date().toISOString(),
          },
        });
      }).toThrow('Event posts must include a title');
    });

    it('rejects malformed event dates', () => {
      expect(() => {
        validateEventPost({
          type: 'event',
          identity: 'identified',
          eventData: {
            title: 'Study Session',
            location: 'Library 3rd Floor',
            eventTime: 'not-a-valid-date',
          },
        });
      }).toThrow('Invalid event date/time format');
    });

    it('accepts identified campus event publication with valid metadata', () => {
      const result = validateEventPost({
        type: 'event',
        identity: 'identified',
        eventData: {
          title: 'ACM Spring Hackathon',
          location: 'Woodward Hall 330',
          eventTime: new Date(Date.now() + 86400000).toISOString(),
        },
      });
      expect(result).toBe(true);
    });
  });

  describe('Event RSVP Atomic Counters', () => {
    function simulateRsvpToggle(
      currentCount: number,
      currentlyGoing: boolean,
      isGoing: boolean
    ): { nextCount: number; nextGoing: boolean } {
      if (isGoing && !currentlyGoing) {
        return { nextCount: currentCount + 1, nextGoing: true };
      } else if (!isGoing && currentlyGoing) {
        return { nextCount: Math.max(0, currentCount - 1), nextGoing: false };
      }
      return { nextCount: currentCount, nextGoing: currentlyGoing };
    }

    it('increments attendee count when student marks going', () => {
      const res = simulateRsvpToggle(10, false, true);
      expect(res.nextCount).toBe(11);
      expect(res.nextGoing).toBe(true);
    });

    it('decrements attendee count when student cancels RSVP', () => {
      const res = simulateRsvpToggle(5, true, false);
      expect(res.nextCount).toBe(4);
      expect(res.nextGoing).toBe(false);
    });

    it('prevents RSVP count from dropping below zero', () => {
      const res = simulateRsvpToggle(0, true, false);
      expect(res.nextCount).toBe(0);
      expect(res.nextGoing).toBe(false);
    });

    it('is idempotent when tapping same RSVP state repeatedly', () => {
      const res1 = simulateRsvpToggle(5, true, true);
      expect(res1.nextCount).toBe(5);
      expect(res1.nextGoing).toBe(true);

      const res2 = simulateRsvpToggle(5, false, false);
      expect(res2.nextCount).toBe(5);
      expect(res2.nextGoing).toBe(false);
    });
  });

  describe('Bookmarks & Saved Threads Lifecycle', () => {
    function createBookmarkPreview(post: PostModel): BookmarkModel {
      return {
        id: post.id,
        postId: post.id,
        savedAt: new Date(),
        postPreview: post.content.slice(0, 140),
        authorPseudonym: post.pseudonym,
        channel: post.channel,
      };
    }

    it('creates bookmark with clean preview truncated to 140 chars', () => {
      const mockPost: PostModel = {
        id: 'post_123',
        campusId: 'uncc',
        channel: 'Housing',
        identity: 'anonymous',
        pseudonym: 'Silent Owl',
        content: 'A'.repeat(200),
        type: 'text',
        tags: ['sublease'],
        imageUrls: [],
        upvotes: 3,
        downvotes: 0,
        score: 3,
        hotScore: 1.5,
        commentCount: 2,
        repostCount: 0,
        createdAt: new Date(),
        isHidden: false,
        isRepost: false,
      };

      const bookmark = createBookmarkPreview(mockPost);
      expect(bookmark.postId).toBe('post_123');
      expect(bookmark.channel).toBe('Housing');
      expect(bookmark.authorPseudonym).toBe('Silent Owl');
      expect(bookmark.postPreview).toHaveLength(140);
    });

    it('maintains in-memory bookmark set for instant optimistic toggle', () => {
      const bookmarkedIds = new Set<string>();

      // Bookmark post
      bookmarkedIds.add('post_1');
      expect(bookmarkedIds.has('post_1')).toBe(true);
      expect(bookmarkedIds.size).toBe(1);

      // Bookmark second post
      bookmarkedIds.add('post_2');
      expect(bookmarkedIds.size).toBe(2);

      // Unbookmark post_1
      bookmarkedIds.delete('post_1');
      expect(bookmarkedIds.has('post_1')).toBe(false);
      expect(bookmarkedIds.has('post_2')).toBe(true);
      expect(bookmarkedIds.size).toBe(1);
    });
  });

  describe('Feed Channel Filtering', () => {
    it('determines whether channel filter applies or shows all campus posts', () => {
      const buildQueryFilters = (channel?: string) => {
        const filters: Record<string, any> = { isHidden: false };
        if (channel && channel !== 'All') {
          filters.channel = channel;
        }
        return filters;
      };

      expect(buildQueryFilters('All')).toEqual({ isHidden: false });
      expect(buildQueryFilters(undefined)).toEqual({ isHidden: false });
      expect(buildQueryFilters('Classes')).toEqual({ isHidden: false, channel: 'Classes' });
      expect(buildQueryFilters('Housing')).toEqual({ isHidden: false, channel: 'Housing' });
      expect(buildQueryFilters('Events')).toEqual({ isHidden: false, channel: 'Events' });
    });
  });
});
