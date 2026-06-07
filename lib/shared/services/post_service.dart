import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/post_model.dart';
import '../models/user_model.dart';
import '../../core/constants/constants.dart';
import 'pseudonym_service.dart';

class PostService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String get _uid => _auth.currentUser!.uid;

  // ── Feed queries ───────────────────────────────────────────────
  Query<Map<String, dynamic>> feedQuery(FeedSort sort) {
    var query = _db
        .collection('posts')
        .where('isHidden', isEqualTo: false);

    switch (sort) {
      case FeedSort.recent:
        return query.orderBy('createdAt', descending: true).limit(60);
      case FeedSort.top:
        return query.orderBy('upvotes', descending: true).limit(60);
      case FeedSort.hot:
        return query.orderBy('createdAt', descending: true).limit(50);
    }
  }

  Stream<List<PostModel>> feedStream(FeedSort sort) {
    return feedQuery(sort).snapshots().map((snap) {
      final posts = snap.docs
          .map((d) => PostModel.fromFirestore(d))
          .where((post) => !post.isExpired)
          .toList();
      if (sort == FeedSort.hot) {
        posts.sort((a, b) => b.hotScore.compareTo(a.hotScore));
      }
      return posts.take(AnonUConstants.postsPerPage).toList();
    });
  }

  Stream<List<PostModel>> tagFeedStream(String tag) {
    return _db
        .collection('posts')
        .where('tags', arrayContains: tag)
        .where('isHidden', isEqualTo: false)
        .orderBy('createdAt', descending: true)
        .limit(AnonUConstants.postsPerPage)
        .snapshots()
        .map((s) => s.docs
            .map((d) => PostModel.fromFirestore(d))
            .where((post) => !post.isExpired)
            .toList());
  }

  Stream<PostModel?> postStream(String postId) {
    return _db.collection('posts').doc(postId).snapshots().map(
        (d) => d.exists ? PostModel.fromFirestore(d) : null);
  }

  Stream<List<CommentModel>> commentsStream(String postId) {
    return _db
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((s) => s.docs.map((d) => CommentModel.fromFirestore(d)).toList());
  }

  // ── Create post ────────────────────────────────────────────────
  Future<String> createPost({
    required PostIdentity identity,
    required String content,
    required PostType type,
    required List<String> tags,
    List<String> imageUrls = const [],
    PollData? poll,
    int? timeLimitHours,
    UserModel? currentUser,
  }) async {
    final ref = _db.collection('posts').doc();
    final pseudonym = PseudonymService.generateForPost(_uid, ref.id);

    final post = PostModel(
      id: ref.id,
      authorUid: _uid,
      identity: identity,
      pseudonym: pseudonym,
      displayName: identity == PostIdentity.identified ? currentUser?.displayName : null,
      avatarUrl: identity == PostIdentity.identified ? currentUser?.avatarUrl : null,
      content: content,
      type: type,
      tags: tags,
      imageUrls: imageUrls,
      poll: poll,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      repostCount: 0,
      createdAt: DateTime.now(),
      expiresAt: timeLimitHours != null
          ? DateTime.now().add(Duration(hours: timeLimitHours))
          : null,
      isHidden: false,
      isRepost: false,
    );

    final batch = _db.batch();
    batch.set(ref, post.toFirestore());
    batch.update(_db.collection('users').doc(_uid), {
      'postCount': FieldValue.increment(1),
    });
    await batch.commit();

    return ref.id;
  }

  // ── Repost ─────────────────────────────────────────────────────
  Future<void> repost(PostModel original, UserModel currentUser) async {
    final ref = _db.collection('posts').doc();
    final pseudonym = PseudonymService.generateForPost(_uid, ref.id);

    final repost = PostModel(
      id: ref.id,
      authorUid: _uid,
      identity: PostIdentity.anonymous, // reposts are always anonymous by default
      pseudonym: pseudonym,
      content: original.content,
      type: original.type,
      tags: original.tags,
      imageUrls: original.imageUrls,
      poll: null, // polls can't be reposted
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      repostCount: 0,
      createdAt: DateTime.now(),
      isHidden: false,
      isRepost: true,
      originalPostId: original.id,
      originalAuthorPseudonym: original.pseudonym,
    );

    final batch = _db.batch();
    batch.set(ref, repost.toFirestore());
    batch.update(_db.collection('posts').doc(original.id), {
      'repostCount': FieldValue.increment(1),
    });
    await batch.commit();
    await _createNotification(
      recipientUid: original.authorUid,
      type: 'repost',
      actorPseudonym: pseudonym,
      postId: original.id,
      postPreview: original.content,
    );
  }

  // ── Voting ─────────────────────────────────────────────────────
  Future<void> vote(PostModel post, bool isUpvote) async {
    final voteRef = _db
        .collection('posts')
        .doc(post.id)
        .collection('votes')
        .doc(_uid);

    final existing = await voteRef.get();
    final postRef = _db.collection('posts').doc(post.id);
    final batch = _db.batch();
    var shouldNotifyUpvote = false;

    if (existing.exists) {
      final wasUpvote = existing.data()?['isUpvote'] as bool;
      if (wasUpvote == isUpvote) {
        // Toggle off
        batch.delete(voteRef);
        batch.update(postRef, {
          isUpvote ? 'upvotes' : 'downvotes': FieldValue.increment(-1),
        });
      } else {
        // Switch vote
        batch.set(voteRef, {'isUpvote': isUpvote, 'uid': _uid});
        shouldNotifyUpvote = isUpvote;
        batch.update(postRef, {
          isUpvote ? 'upvotes' : 'downvotes': FieldValue.increment(1),
          isUpvote ? 'downvotes' : 'upvotes': FieldValue.increment(-1),
        });
      }
    } else {
      // New vote
      batch.set(voteRef, {'isUpvote': isUpvote, 'uid': _uid});
      shouldNotifyUpvote = isUpvote;
      batch.update(postRef, {
        isUpvote ? 'upvotes' : 'downvotes': FieldValue.increment(1),
      });
      // Auto-hide check happens via Cloud Function, but client-side guard:
      if (!isUpvote && post.score - 1 <= AnonUConstants.autoHideThreshold) {
        batch.update(postRef, {'isHidden': true});
      }
    }

    await batch.commit();
    if (shouldNotifyUpvote && post.authorUid != _uid) {
      await _createNotification(
        recipientUid: post.authorUid,
        type: 'upvote',
        actorPseudonym: await _currentActorName(),
        postId: post.id,
        postPreview: post.content,
      );
    }
  }

  Future<bool?> getUserVote(String postId) async {
    final doc = await _db
        .collection('posts')
        .doc(postId)
        .collection('votes')
        .doc(_uid)
        .get();
    if (!doc.exists) return null;
    return doc.data()?['isUpvote'] as bool?;
  }

  // ── Comments ───────────────────────────────────────────────────
  Future<void> addComment({
    required String postId,
    required String content,
    required PostIdentity identity,
    String? parentCommentId,
    UserModel? currentUser,
  }) async {
    final ref = _db.collection('posts').doc(postId).collection('comments').doc();
    final pseudonym = PseudonymService.generateForPost(_uid, postId);

    final comment = CommentModel(
      id: ref.id,
      postId: postId,
      authorUid: _uid,
      identity: identity,
      pseudonym: pseudonym,
      displayName: identity == PostIdentity.identified ? currentUser?.displayName : null,
      content: content,
      upvotes: 0,
      downvotes: 0,
      createdAt: DateTime.now(),
      parentCommentId: parentCommentId,
    );

    final batch = _db.batch();
    batch.set(ref, comment.toFirestore());
    batch.update(_db.collection('posts').doc(postId), {
      'commentCount': FieldValue.increment(1),
    });
    await batch.commit();
    await _createNotification(
      recipientUid: (await _db.collection('posts').doc(postId).get()).data()?['authorUid'] ?? '',
      type: parentCommentId == null ? 'comment' : 'reply',
      actorPseudonym: pseudonym,
      postId: postId,
      postPreview: content,
    );
  }

  // ── Poll voting ────────────────────────────────────────────────
  Future<void> votePoll(String postId, int optionIndex) async {
    final pollVoteRef = _db
        .collection('posts')
        .doc(postId)
        .collection('pollVotes')
        .doc(_uid);

    final existing = await pollVoteRef.get();
    if (existing.exists) return; // already voted

    final batch = _db.batch();
    batch.set(pollVoteRef, {'optionIndex': optionIndex});
    batch.update(_db.collection('posts').doc(postId), {
      'poll.votes.$optionIndex': FieldValue.increment(1),
    });
    await batch.commit();
  }

  // ── Report ─────────────────────────────────────────────────────
  Future<void> reportPost(String postId, String reason) async {
    await _db.collection('reports').add({
      'postId': postId,
      'reportedBy': _uid,
      'reason': reason,
      'createdAt': Timestamp.now(),
      'resolved': false,
    });
  }

  Stream<List<Map<String, dynamic>>> reportsStream() {
    return _db
        .collection('reports')
        .where('resolved', isEqualTo: false)
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  Future<void> resolveReport(String reportId, {String? postId, bool hidePost = false}) async {
    final batch = _db.batch();
    batch.update(_db.collection('reports').doc(reportId), {'resolved': true});
    if (hidePost && postId != null) {
      batch.update(_db.collection('posts').doc(postId), {'isHidden': true});
    }
    await batch.commit();
  }

  // ── Search ─────────────────────────────────────────────────────
  Future<List<PostModel>> searchPosts(String query) async {
    // Basic tag/content search — for production use Algolia or Typesense
    final tagResults = await _db
        .collection('posts')
        .where('tags', arrayContains: query.toLowerCase())
        .where('isHidden', isEqualTo: false)
        .orderBy('createdAt', descending: true)
        .limit(20)
        .get();

    return tagResults.docs
        .map((d) => PostModel.fromFirestore(d))
        .where((post) => !post.isExpired)
        .toList();
  }

  // ── User posts ─────────────────────────────────────────────────
  Stream<List<PostModel>> userPostsStream(String uid) {
    return _db
        .collection('posts')
        .where('authorUid', isEqualTo: uid)
        .where('isHidden', isEqualTo: false)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((s) => s.docs
            .map((d) => PostModel.fromFirestore(d))
            .where((post) => !post.isExpired)
            .toList());
  }

  Future<void> _createNotification({
    required String recipientUid,
    required String type,
    required String actorPseudonym,
    String? postId,
    String? postPreview,
  }) async {
    if (recipientUid.isEmpty || recipientUid == _uid) return;
    await _db.collection('notifications').add({
      'recipientUid': recipientUid,
      'type': type,
      'actorPseudonym': actorPseudonym,
      if (postId != null) 'postId': postId,
      if (postPreview != null) 'postPreview': postPreview.length > 90
          ? '${postPreview.substring(0, 90)}...'
          : postPreview,
      'isRead': false,
      'createdAt': Timestamp.now(),
    });
  }

  Future<String> _currentActorName() async {
    final doc = await _db.collection('users').doc(_uid).get();
    return doc.data()?['pseudonym'] as String? ?? 'Someone';
  }
}
