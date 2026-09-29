import { firestore, functions } from './firebase';
import {
  PostModel,
  CommentModel,
  FeedSort,
  PostIdentity,
  PostType,
  PaginatedFeedResult,
  BookmarkModel,
} from '../types/post';

function parsePostDoc(doc: any): PostModel {
  const data = doc.data() || {};
  return {
    id: doc.id,
    campusId: data.campusId || 'uncc',
    channel: data.channel || 'General',
    identity: (data.identity as PostIdentity) || 'anonymous',
    pseudonym: data.pseudonym || 'Campus Member',
    authorProfileId: data.authorProfileId || null,
    displayName: data.displayName || null,
    avatarUrl: data.avatarUrl || null,
    content: data.content || '',
    type: (data.type as PostType) || 'text',
    tags: Array.isArray(data.tags) ? data.tags : [],
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    poll: data.poll
      ? {
          options: data.poll.options || [],
          votes: data.poll.votes || {},
          endsAt: data.poll.endsAt ? data.poll.endsAt.toDate() : new Date(),
        }
      : null,
    eventData: data.eventData
      ? {
          title: data.eventData.title || '',
          eventTime: data.eventData.eventTime ? data.eventData.eventTime.toDate() : new Date(),
          location: data.eventData.location || '',
          rsvpCount: data.eventData.rsvpCount || 0,
        }
      : null,
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,
    score: data.score || 0,
    hotScore: data.hotScore || 0,
    commentCount: data.commentCount || 0,
    repostCount: data.repostCount || 0,
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    expiresAt: data.expiresAt ? data.expiresAt.toDate() : null,
    isHidden: data.isHidden || false,
    isRepost: data.isRepost || false,
    originalPostId: data.originalPostId || null,
    originalAuthorPseudonym: data.originalAuthorPseudonym || null,
  };
}

function parseCommentDoc(doc: any): CommentModel {
  const data = doc.data() || {};
  return {
    id: doc.id,
    postId: data.postId || '',
    campusId: data.campusId || null,
    identity: (data.identity as PostIdentity) || 'anonymous',
    pseudonym: data.pseudonym || 'Campus Member',
    authorProfileId: data.authorProfileId || null,
    displayName: data.displayName || null,
    content: data.content || '',
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    parentCommentId: data.parentCommentId || null,
  };
}

export const postService = {
  async getFeedPaginated(
    sort: FeedSort = 'hot',
    limit = 20,
    campusId?: string,
    channel?: string,
    lastDoc?: any | null
  ): Promise<PaginatedFeedResult> {
    let query = firestore().collection('posts').where('isHidden', '==', false);

    if (campusId) {
      query = query.where('campusId', '==', campusId);
    }

    if (channel && channel !== 'All') {
      query = query.where('channel', '==', channel);
    }

    switch (sort) {
      case 'hot':
        query = query.orderBy('hotScore', 'desc');
        break;
      case 'recent':
        query = query.orderBy('createdAt', 'desc');
        break;
      case 'top':
        query = query.orderBy('score', 'desc');
        break;
    }

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.limit(limit).get();
    const now = Date.now();
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    const posts = snap.docs
      .map(parsePostDoc)
      .filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now);

    return {
      posts,
      lastDoc: lastVisible,
      hasMore: snap.docs.length >= limit,
    };
  },

  async getFeed(
    sort: FeedSort = 'hot',
    limit = 25,
    campusId?: string,
    channel?: string
  ): Promise<PostModel[]> {
    let query = firestore().collection('posts').where('isHidden', '==', false);

    if (campusId) {
      query = query.where('campusId', '==', campusId);
    }

    if (channel && channel !== 'All') {
      query = query.where('channel', '==', channel);
    }

    switch (sort) {
      case 'hot':
        query = query.orderBy('hotScore', 'desc');
        break;
      case 'recent':
        query = query.orderBy('createdAt', 'desc');
        break;
      case 'top':
        query = query.orderBy('score', 'desc');
        break;
    }

    const snap = await query.limit(limit).get();
    const now = Date.now();

    return snap.docs
      .map(parsePostDoc)
      .filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now);
  },

  async getPost(postId: string): Promise<PostModel | null> {
    const doc = await firestore().collection('posts').doc(postId).get();
    if (!doc.exists) return null;
    return parsePostDoc(doc);
  },

  async getUserVote(postId: string, uid: string): Promise<boolean | null> {
    const voteDoc = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('votes')
      .doc(uid)
      .get();
    if (!voteDoc.exists) return null;
    return voteDoc.data()?.vote ?? null;
  },

  async vote(postId: string, uid: string, isUpvote: boolean) {
    const voteRef = firestore()
      .collection('posts')
      .doc(postId)
      .collection('votes')
      .doc(uid);

    const currentSnap = await voteRef.get();
    if (currentSnap.exists && currentSnap.data()?.vote === isUpvote) {
      // Toggle off / cancel vote
      await voteRef.delete();
      return null;
    }

    await voteRef.set({
      vote: isUpvote,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return isUpvote;
  },

  async getComments(postId: string): Promise<CommentModel[]> {
    const snap = await firestore()
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'asc')
      .get();

    return snap.docs.map(parseCommentDoc);
  },

  async createPost(params: {
    content: string;
    identity: PostIdentity;
    type: PostType;
    channel?: string;
    tags?: string[];
    imageUrls?: string[];
    poll?: {
      options: string[];
      durationHours?: number;
    };
    eventData?: {
      title: string;
      eventTime: Date | string | number;
      location: string;
    };
    timeLimitHours?: number | null;
  }) {
    const fn = functions().httpsCallable('createPost');
    const result = await fn(params);
    return result.data as { postId: string; pseudonym: string; campusId: string };
  },

  async rsvpEvent(postId: string, isGoing: boolean) {
    const fn = functions().httpsCallable('rsvpEvent');
    const result = await fn({ postId, isGoing });
    return result.data as { success: boolean; postId: string; isGoing: boolean; rsvpCount: number };
  },

  async getUserRsvp(postId: string, uid: string): Promise<boolean> {
    const snap = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('rsvps')
      .doc(uid)
      .get();
    return snap.exists && snap.data()?.isGoing === true;
  },

  async bookmarkPost(uid: string, post: PostModel) {
    return firestore()
      .collection('users')
      .doc(uid)
      .collection('bookmarks')
      .doc(post.id)
      .set({
        postId: post.id,
        savedAt: firestore.FieldValue.serverTimestamp(),
        postPreview: post.content.slice(0, 140),
        authorPseudonym: post.pseudonym,
        channel: post.channel,
      });
  },

  async unbookmarkPost(uid: string, postId: string) {
    return firestore()
      .collection('users')
      .doc(uid)
      .collection('bookmarks')
      .doc(postId)
      .delete();
  },

  async isPostBookmarked(uid: string, postId: string): Promise<boolean> {
    const snap = await firestore()
      .collection('users')
      .doc(uid)
      .collection('bookmarks')
      .doc(postId)
      .get();
    return snap.exists;
  },

  async getBookmarkedPosts(uid: string): Promise<BookmarkModel[]> {
    const snap = await firestore()
      .collection('users')
      .doc(uid)
      .collection('bookmarks')
      .orderBy('savedAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId || doc.id,
        savedAt: data.savedAt ? data.savedAt.toDate() : new Date(),
        postPreview: data.postPreview || '',
        authorPseudonym: data.authorPseudonym || 'Campus Member',
        channel: data.channel || 'General',
      };
    });
  },

  subscribeBookmarks(uid: string, callback: (bookmarkedIds: Set<string>) => void) {
    return firestore()
      .collection('users')
      .doc(uid)
      .collection('bookmarks')
      .onSnapshot((snap) => {
        const ids = new Set<string>();
        snap.forEach((doc) => ids.add(doc.id));
        callback(ids);
      });
  },

  async createComment(params: {
    postId: string;
    content: string;
    identity: PostIdentity;
    parentCommentId?: string | null;
  }) {
    const fn = functions().httpsCallable('createComment');
    const result = await fn(params);
    return result.data as { commentId: string; pseudonym: string };
  },

  async votePoll(postId: string, optionIndex: number) {
    const fn = functions().httpsCallable('votePoll');
    const result = await fn({ postId, optionIndex });
    return result.data as { success: boolean; votes: Record<string, number> };
  },

  async getUserPollVote(postId: string, uid: string): Promise<number | null> {
    const snap = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('pollVotes')
      .doc(uid)
      .get();
    if (!snap.exists) return null;
    return snap.data()?.optionIndex ?? null;
  },

  async repostPost(postId: string) {
    const fn = functions().httpsCallable('repostPost');
    const result = await fn({ postId });
    return result.data as { newPostId: string; pseudonym: string };
  },

  async reportPost(postId: string, reason: string) {
    return firestore().collection('reports').add({
      postId,
      reason,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  async reportComment(commentId: string, reason: string) {
    return firestore().collection('reports').add({
      commentId,
      reason,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  async searchPosts(term: string, campusId?: string): Promise<PostModel[]> {
    const clean = term.toLowerCase().trim().replace(/^#/, '');
    if (!clean) return [];

    // Tag search
    let tagQuery = firestore()
      .collection('posts')
      .where('tags', 'array-contains', clean)
      .where('isHidden', '==', false);

    if (campusId) {
      tagQuery = tagQuery.where('campusId', '==', campusId);
    }

    const tagSnap = await tagQuery.limit(30).get();

    if (!tagSnap.empty) {
      return tagSnap.docs.map(parsePostDoc);
    }

    // Fallback: Recent posts filtered in-memory
    let recentQuery = firestore()
      .collection('posts')
      .where('isHidden', '==', false);

    if (campusId) {
      recentQuery = recentQuery.where('campusId', '==', campusId);
    }

    const recentSnap = await recentQuery
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return recentSnap.docs
      .map(parsePostDoc)
      .filter(
        (p) =>
          p.content.toLowerCase().includes(clean) ||
          p.tags.some((t) => t.toLowerCase().includes(clean))
      );
  },

  async getUserPosts(uid: string): Promise<PostModel[]> {
    // Query private author mapping that the user owns
    const authorSnap = await firestore()
      .collection('postAuthors')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    if (authorSnap.empty) return [];

    const postIds = authorSnap.docs.map((d) => d.id);
    const postDocs = await Promise.all(
      postIds.map((id) => firestore().collection('posts').doc(id).get())
    );

    return postDocs.filter((d) => d.exists).map(parsePostDoc);
  },

  async getReports() {
    const snap = await firestore()
      .collection('reports')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async resolveReport(params: {
    reportId: string;
    action: 'dismiss' | 'hide' | 'restore' | 'strike';
    postId?: string;
    reason?: string;
  }) {
    const fn = functions().httpsCallable('resolveReport');
    const result = await fn(params);
    return result.data as { success: boolean; action: string; strikeDetails?: any };
  },

  async blockAuthor(params: { postId?: string; commentId?: string }) {
    const fn = functions().httpsCallable('blockAuthor');
    const result = await fn(params);
    return result.data as { success: boolean; message: string };
  },

  async unblockAuthor(params: { targetUid?: string; postId?: string }) {
    const fn = functions().httpsCallable('unblockAuthor');
    const result = await fn(params);
    return result.data as { success: boolean };
  },

  subscribeBlockedPosts(uid: string, callback: (blockedPostIds: Set<string>) => void) {
    return firestore()
      .collection('users')
      .doc(uid)
      .collection('blockedPosts')
      .onSnapshot((snap) => {
        const ids = new Set<string>();
        snap.forEach((doc) => ids.add(doc.id));
        callback(ids);
      });
  },

  async submitAppeal(strikeId: string, explanation: string) {
    const fn = functions().httpsCallable('submitAppeal');
    const result = await fn({ strikeId, explanation });
    return result.data as { success: boolean; appealId: string };
  },

  async getAppeals() {
    const snap = await firestore()
      .collection('appeals')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getModeratorAuditLogs() {
    const snap = await firestore()
      .collection('moderatorAuditLog')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};
