export type PostIdentity = 'anonymous' | 'identified';
export type PostType = 'text' | 'poll' | 'image';
export type FeedSort = 'hot' | 'recent' | 'top';

export interface PollData {
  options: string[];
  votes: Record<string, number>; // optionIndex -> count
  endsAt: Date;
}

export interface PostModel {
  id: string;
  campusId: string;
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
