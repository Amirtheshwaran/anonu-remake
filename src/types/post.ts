export type PostIdentity = 'anonymous' | 'identified';
export type PostType = 'text' | 'poll' | 'image' | 'event';
export type FeedSort = 'hot' | 'recent' | 'top';

export interface PaginatedFeedResult {
  posts: PostModel[];
  lastDoc: any | null;
  hasMore: boolean;
}

export interface PollData {
  options: string[];
  votes: Record<string, number>; // optionIndex -> count
  endsAt: Date;
}

export interface EventData {
  title: string;
  eventTime: Date;
  location: string;
  rsvpCount: number;
}

export interface BookmarkModel {
  id: string;
  postId: string;
  savedAt: Date;
  postPreview: string;
  authorPseudonym: string;
  channel?: string;
}

export interface PostModel {
  id: string;
  campusId: string;
  channel: string;
  identity: PostIdentity;
  pseudonym: string;
  authorProfileId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  content: string;
  type: PostType;
  tags: string[];
  imageUrls: string[];
  poll?: PollData | null;
  eventData?: EventData | null;
  upvotes: number;
  downvotes: number;
  score: number;
  hotScore: number;
  commentCount: number;
  repostCount: number;
  createdAt: Date;
  expiresAt?: Date | null;
  isHidden: boolean;
  isRepost: boolean;
  originalPostId?: string | null;
  originalAuthorPseudonym?: string | null;
  moderationSeverity?: 'low' | 'medium' | 'high' | 'crisis';
  moderationReason?: string | null;
}

export interface CommentModel {
  id: string;
  postId: string;
  campusId?: string;
  identity: PostIdentity;
  pseudonym: string;
  authorProfileId?: string | null;
  displayName?: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  parentCommentId?: string | null;
}
