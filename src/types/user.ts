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
  strikeCount?: number;
  timeoutUntil?: Date | null;
  isBanned?: boolean;
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
  commentId?: string | null;
  campusId?: string | null;
  reason: string;
  severity?: 'low' | 'medium' | 'high' | 'crisis';
  status: 'pending' | 'resolved' | 'dismissed';
  screeningScores?: Record<string, number>;
  reportedBy?: string | null;
  resolvedAction?: 'dismiss' | 'hide' | 'restore' | 'strike';
  resolvedBy?: string | null;
  resolvedReason?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
}

export interface ModeratorAuditLogEntry {
  id: string;
  moderatorUid: string;
  action: 'dismiss' | 'hide' | 'restore' | 'strike';
  reportId: string;
  postId?: string | null;
  targetAuthorUid?: string | null;
  reason?: string | null;
  timestamp: Date;
}

export interface UserAppeal {
  id: string;
  uid: string;
  strikeId: string;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface UserStrike {
  id: string;
  reportId: string;
  postId?: string | null;
  reason: string;
  strikeNumber: number;
  moderatorUid: string;
  issuedAt: Date;
}
