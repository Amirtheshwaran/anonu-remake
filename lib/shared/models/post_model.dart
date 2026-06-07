import 'package:cloud_firestore/cloud_firestore.dart';

enum PostIdentity { anonymous, identified }
enum PostType { text, poll, image }
enum FeedSort { hot, recent, top }

class PostModel {
  final String id;
  final String authorUid;
  final PostIdentity identity;
  final String pseudonym; // e.g. "Cyan Kestrel" — always generated, shown when anonymous
  final String? displayName; // shown when identified
  final String? avatarUrl;
  final String content;
  final PostType type;
  final List<String> tags;
  final List<String> imageUrls;
  final PollData? poll;
  final int upvotes;
  final int downvotes;
  final int commentCount;
  final int repostCount;
  final DateTime createdAt;
  final DateTime? expiresAt; // null = permanent
  final bool isHidden; // auto-hidden at threshold
  final bool isRepost;
  final String? originalPostId;
  final String? originalAuthorPseudonym;

  int get score => upvotes - downvotes;
  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
  bool get isAnonymous => identity == PostIdentity.anonymous;

  // Hot score: score + time decay (HN-style)
  double get hotScore {
    final ageHours = DateTime.now().difference(createdAt).inMinutes / 60.0;
    return score / ((ageHours + 2) * 1.8);
  }

  const PostModel({
    required this.id,
    required this.authorUid,
    required this.identity,
    required this.pseudonym,
    this.displayName,
    this.avatarUrl,
    required this.content,
    required this.type,
    required this.tags,
    required this.imageUrls,
    this.poll,
    required this.upvotes,
    required this.downvotes,
    required this.commentCount,
    required this.repostCount,
    required this.createdAt,
    this.expiresAt,
    required this.isHidden,
    required this.isRepost,
    this.originalPostId,
    this.originalAuthorPseudonym,
  });

  factory PostModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return PostModel(
      id: doc.id,
      authorUid: data['authorUid'] ?? '',
      identity: data['identity'] == 'identified'
          ? PostIdentity.identified
          : PostIdentity.anonymous,
      pseudonym: data['pseudonym'] ?? 'Unknown',
      displayName: data['displayName'],
      avatarUrl: data['avatarUrl'],
      content: data['content'] ?? '',
      type: _parseType(data['type']),
      tags: List<String>.from(data['tags'] ?? []),
      imageUrls: List<String>.from(data['imageUrls'] ?? []),
      poll: data['poll'] != null ? PollData.fromMap(data['poll']) : null,
      upvotes: data['upvotes'] ?? 0,
      downvotes: data['downvotes'] ?? 0,
      commentCount: data['commentCount'] ?? 0,
      repostCount: data['repostCount'] ?? 0,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      expiresAt: data['expiresAt'] != null
          ? (data['expiresAt'] as Timestamp).toDate()
          : null,
      isHidden: data['isHidden'] ?? false,
      isRepost: data['isRepost'] ?? false,
      originalPostId: data['originalPostId'],
      originalAuthorPseudonym: data['originalAuthorPseudonym'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'authorUid': authorUid,
      'identity': identity.name,
      'pseudonym': pseudonym,
      if (displayName != null) 'displayName': displayName,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      'content': content,
      'type': type.name,
      'tags': tags,
      'imageUrls': imageUrls,
      if (poll != null) 'poll': poll!.toMap(),
      'upvotes': upvotes,
      'downvotes': downvotes,
      'commentCount': commentCount,
      'repostCount': repostCount,
      'createdAt': Timestamp.fromDate(createdAt),
      if (expiresAt != null) 'expiresAt': Timestamp.fromDate(expiresAt!),
      'isHidden': isHidden,
      'isRepost': isRepost,
      if (originalPostId != null) 'originalPostId': originalPostId,
      if (originalAuthorPseudonym != null)
        'originalAuthorPseudonym': originalAuthorPseudonym,
    };
  }

  static PostType _parseType(String? t) {
    switch (t) {
      case 'poll': return PostType.poll;
      case 'image': return PostType.image;
      default: return PostType.text;
    }
  }

  PostModel copyWith({
    int? upvotes,
    int? downvotes,
    int? commentCount,
    int? repostCount,
    bool? isHidden,
    PollData? poll,
  }) {
    return PostModel(
      id: id,
      authorUid: authorUid,
      identity: identity,
      pseudonym: pseudonym,
      displayName: displayName,
      avatarUrl: avatarUrl,
      content: content,
      type: type,
      tags: tags,
      imageUrls: imageUrls,
      poll: poll ?? this.poll,
      upvotes: upvotes ?? this.upvotes,
      downvotes: downvotes ?? this.downvotes,
      commentCount: commentCount ?? this.commentCount,
      repostCount: repostCount ?? this.repostCount,
      createdAt: createdAt,
      expiresAt: expiresAt,
      isHidden: isHidden ?? this.isHidden,
      isRepost: isRepost,
      originalPostId: originalPostId,
      originalAuthorPseudonym: originalAuthorPseudonym,
    );
  }
}

class PollData {
  final List<String> options;
  final Map<String, int> votes; // option index -> vote count
  final Map<String, String> userVotes; // uid -> option index (secured server-side)
  final DateTime endsAt;

  const PollData({
    required this.options,
    required this.votes,
    required this.userVotes,
    required this.endsAt,
  });

  bool get isExpired => DateTime.now().isAfter(endsAt);
  int get totalVotes => votes.values.fold(0, (a, b) => a + b);

  factory PollData.fromMap(Map<String, dynamic> map) {
    return PollData(
      options: List<String>.from(map['options'] ?? []),
      votes: Map<String, int>.from(map['votes'] ?? {}),
      userVotes: Map<String, String>.from(map['userVotes'] ?? {}),
      endsAt: (map['endsAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'options': options,
      'votes': votes,
      'userVotes': userVotes,
      'endsAt': Timestamp.fromDate(endsAt),
    };
  }
}

class CommentModel {
  final String id;
  final String postId;
  final String authorUid;
  final PostIdentity identity;
  final String pseudonym;
  final String? displayName;
  final String content;
  final int upvotes;
  final int downvotes;
  final DateTime createdAt;
  final String? parentCommentId; // for nested replies

  int get score => upvotes - downvotes;
  bool get isAnonymous => identity == PostIdentity.anonymous;

  const CommentModel({
    required this.id,
    required this.postId,
    required this.authorUid,
    required this.identity,
    required this.pseudonym,
    this.displayName,
    required this.content,
    required this.upvotes,
    required this.downvotes,
    required this.createdAt,
    this.parentCommentId,
  });

  factory CommentModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return CommentModel(
      id: doc.id,
      postId: data['postId'] ?? '',
      authorUid: data['authorUid'] ?? '',
      identity: data['identity'] == 'identified'
          ? PostIdentity.identified
          : PostIdentity.anonymous,
      pseudonym: data['pseudonym'] ?? 'Unknown',
      displayName: data['displayName'],
      content: data['content'] ?? '',
      upvotes: data['upvotes'] ?? 0,
      downvotes: data['downvotes'] ?? 0,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      parentCommentId: data['parentCommentId'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'postId': postId,
      'authorUid': authorUid,
      'identity': identity.name,
      'pseudonym': pseudonym,
      if (displayName != null) 'displayName': displayName,
      'content': content,
      'upvotes': upvotes,
      'downvotes': downvotes,
      'createdAt': Timestamp.fromDate(createdAt),
      if (parentCommentId != null) 'parentCommentId': parentCommentId,
    };
  }
}
