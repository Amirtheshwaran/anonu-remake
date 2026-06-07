import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String pseudonym; // permanent anonymous pseudonym e.g. "Cyan Kestrel"
  final String? displayName; // optional identified name
  final String? avatarUrl;
  final int postCount;
  final int upvotesReceived;
  final int currentStreak; // mood check-in streak
  final int longestStreak;
  final DateTime? lastMoodCheckIn;
  final String? lastMood;
  final List<String> votedPosts; // post IDs + vote type stored in subcollection
  final DateTime joinedAt;
  final bool isModerator;

  const UserModel({
    required this.uid,
    required this.email,
    required this.pseudonym,
    this.displayName,
    this.avatarUrl,
    required this.postCount,
    required this.upvotesReceived,
    required this.currentStreak,
    required this.longestStreak,
    this.lastMoodCheckIn,
    this.lastMood,
    required this.votedPosts,
    required this.joinedAt,
    required this.isModerator,
  });

  bool get hasIdentifiedProfile => displayName != null;

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel(
      uid: doc.id,
      email: data['email'] ?? '',
      pseudonym: data['pseudonym'] ?? 'Unknown',
      displayName: data['displayName'],
      avatarUrl: data['avatarUrl'],
      postCount: data['postCount'] ?? 0,
      upvotesReceived: data['upvotesReceived'] ?? 0,
      currentStreak: data['currentStreak'] ?? 0,
      longestStreak: data['longestStreak'] ?? 0,
      lastMoodCheckIn: data['lastMoodCheckIn'] != null
          ? (data['lastMoodCheckIn'] as Timestamp).toDate()
          : null,
      lastMood: data['lastMood'],
      votedPosts: List<String>.from(data['votedPosts'] ?? []),
      joinedAt: data['joinedAt'] != null
          ? (data['joinedAt'] as Timestamp).toDate()
          : DateTime.now(),
      isModerator: data['isModerator'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'email': email,
      'pseudonym': pseudonym,
      if (displayName != null) 'displayName': displayName,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      'postCount': postCount,
      'upvotesReceived': upvotesReceived,
      'currentStreak': currentStreak,
      'longestStreak': longestStreak,
      if (lastMoodCheckIn != null)
        'lastMoodCheckIn': Timestamp.fromDate(lastMoodCheckIn!),
      if (lastMood != null) 'lastMood': lastMood,
      'votedPosts': votedPosts,
      'joinedAt': Timestamp.fromDate(joinedAt),
      'isModerator': isModerator,
    };
  }

  UserModel copyWith({
    String? displayName,
    String? avatarUrl,
    int? postCount,
    int? upvotesReceived,
    int? currentStreak,
    int? longestStreak,
    DateTime? lastMoodCheckIn,
    String? lastMood,
  }) {
    return UserModel(
      uid: uid,
      email: email,
      pseudonym: pseudonym,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      postCount: postCount ?? this.postCount,
      upvotesReceived: upvotesReceived ?? this.upvotesReceived,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      lastMoodCheckIn: lastMoodCheckIn ?? this.lastMoodCheckIn,
      lastMood: lastMood ?? this.lastMood,
      votedPosts: votedPosts,
      joinedAt: joinedAt,
      isModerator: isModerator,
    );
  }
}

class NotificationModel {
  final String id;
  final String recipientUid;
  final NotificationType type;
  final String actorPseudonym;
  final String? postId;
  final String? postPreview;
  final bool isRead;
  final DateTime createdAt;

  const NotificationModel({
    required this.id,
    required this.recipientUid,
    required this.type,
    required this.actorPseudonym,
    this.postId,
    this.postPreview,
    required this.isRead,
    required this.createdAt,
  });

  String get message {
    switch (type) {
      case NotificationType.upvote:
        return '$actorPseudonym upvoted your post';
      case NotificationType.comment:
        return '$actorPseudonym commented on your post';
      case NotificationType.reply:
        return '$actorPseudonym replied to your comment';
      case NotificationType.repost:
        return '$actorPseudonym reposted your post';
      case NotificationType.mention:
        return '$actorPseudonym mentioned you';
    }
  }

  factory NotificationModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return NotificationModel(
      id: doc.id,
      recipientUid: data['recipientUid'] ?? '',
      type: NotificationType.values.firstWhere(
        (e) => e.name == data['type'],
        orElse: () => NotificationType.upvote,
      ),
      actorPseudonym: data['actorPseudonym'] ?? 'Someone',
      postId: data['postId'],
      postPreview: data['postPreview'],
      isRead: data['isRead'] ?? false,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
    );
  }
}

enum NotificationType { upvote, comment, reply, repost, mention }
