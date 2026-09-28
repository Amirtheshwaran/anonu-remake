export interface UserModel {
  uid: string;
  email: string;
  campusId: string;
  pseudonym: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  currentStreak: number;
  longestStreak: number;
  postCount: number;
  upvotesReceived: number;
  lastMood?: string | null;
  lastMoodDate?: string | null;
  isModerator?: boolean;
  rulesAcceptedAt?: Date | null;
  onboardingCompleted?: boolean;
  createdAt: Date;
}

export type NotificationType = 'upvote' | 'comment' | 'reply' | 'repost' | 'mention';

export interface NotificationModel {
  id: string;
  recipientUid: string;
  type: NotificationType;
  message: string;
  postId?: string | null;
  postPreview?: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface IncidentReport {
  id: string;
  postId?: string | null;
  reason: string;
  reportedBy?: string | null;
  status: 'pending' | 'resolved';
  resolvedBy?: string | null;
  createdAt: Date;
}
