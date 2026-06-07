import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/models/user_model.dart';
import 'package:anonu/shared/widgets/post_card.dart';

// ── Profile Screen ──────────────────────────────────────────────────────────
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).value;
    if (user == null) {
      return const Scaffold(
        backgroundColor: AnonUTheme.background,
        body: Center(child: CircularProgressIndicator(color: AnonUTheme.maroon)),
      );
    }

    final postsStream = ref.watch(
      StreamProvider<List<PostModel>>((ref) =>
          ref.read(postServiceProvider).userPostsStream(user.uid)),
    );

    return Scaffold(
      backgroundColor: AnonUTheme.background,
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AnonUTheme.textSecondary),
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              if (context.mounted) context.go('/auth');
            },
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _ProfileHeader(user: user)),
          SliverToBoxAdapter(child: _StatsRow(user: user)),
          SliverToBoxAdapter(child: _ProfileActions(user: user)),
          if (user.isModerator) const SliverToBoxAdapter(child: _ModeratorPanel()),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Text(
                'Your Posts',
                style: TextStyle(
                    color: AnonUTheme.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5),
              ),
            ),
          ),
          postsStream.when(
            data: (posts) => SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) => PostCard(
                  post: posts[i],
                  onTap: () => context.push('/post/${posts[i].id}'),
                  onUpvote: () => ref.read(postServiceProvider).vote(posts[i], true),
                  onDownvote: () => ref.read(postServiceProvider).vote(posts[i], false),
                  onComment: () => context.push('/post/${posts[i].id}'),
                  onRepost: () => ref
                      .read(postServiceProvider)
                      .repost(posts[i], user),
                  onReport: () => ref
                      .read(postServiceProvider)
                      .reportPost(posts[i].id, 'Profile report'),
                ),
                childCount: posts.length,
              ),
            ),
            loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
          ),
        ],
      ),
    );
  }
}

class _ProfileActions extends ConsumerWidget {
  final UserModel user;
  const _ProfileActions({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      color: AnonUTheme.surface,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: OutlinedButton.icon(
        onPressed: () => _showEditProfile(context, ref),
        icon: const Icon(Icons.edit_outlined, size: 16),
        label: const Text('Edit identified profile'),
      ),
    );
  }

  Future<void> _showEditProfile(BuildContext context, WidgetRef ref) async {
    final nameController = TextEditingController(text: user.displayName ?? '');
    final avatarController = TextEditingController(text: user.avatarUrl ?? '');
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AnonUTheme.surface,
        title: const Text('Identified profile',
            style: TextStyle(color: AnonUTheme.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: AnonUTheme.textPrimary),
              decoration: const InputDecoration(hintText: 'Display name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: avatarController,
              style: const TextStyle(color: AnonUTheme.textPrimary),
              decoration: const InputDecoration(hintText: 'Avatar URL'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (saved == true) {
      await ref.read(authServiceProvider).updateProfile(
            displayName: nameController.text.trim().isEmpty
                ? null
                : nameController.text.trim(),
            avatarUrl: avatarController.text.trim().isEmpty
                ? null
                : avatarController.text.trim(),
          );
      ref.invalidate(currentUserProvider);
    }
  }
}

class _ModeratorPanel extends ConsumerWidget {
  const _ModeratorPanel();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reports = ref.watch(
      StreamProvider((ref) => ref.read(postServiceProvider).reportsStream()),
    );
    return Container(
      margin: const EdgeInsets.only(top: 1),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      color: AnonUTheme.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Moderator Queue',
            style: TextStyle(
              color: AnonUTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 8),
          reports.when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => Text('$e',
                style: const TextStyle(color: AnonUTheme.downvote)),
            data: (items) {
              if (items.isEmpty) {
                return const Text('No open reports',
                    style: TextStyle(color: AnonUTheme.textMuted));
              }
              return Column(
                children: items.take(5).map((report) {
                  final postId = report['postId'] as String?;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      report['reason']?.toString() ?? 'Report',
                      style: const TextStyle(color: AnonUTheme.textPrimary),
                    ),
                    subtitle: Text(
                      postId ?? '',
                      style: const TextStyle(color: AnonUTheme.textMuted),
                    ),
                    trailing: Wrap(
                      spacing: 6,
                      children: [
                        IconButton(
                          tooltip: 'Resolve',
                          icon: const Icon(Icons.check_rounded),
                          onPressed: () => ref
                              .read(postServiceProvider)
                              .resolveReport(report['id'] as String),
                        ),
                        IconButton(
                          tooltip: 'Hide post',
                          icon: const Icon(Icons.visibility_off_outlined),
                          onPressed: () => ref.read(postServiceProvider).resolveReport(
                                report['id'] as String,
                                postId: postId,
                                hidePost: true,
                              ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final UserModel user;
  const _ProfileHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
      color: AnonUTheme.surface,
      child: Column(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: AnonUTheme.maroon.withOpacity(0.2),
            child: Text(
              user.pseudonym[0],
              style: const TextStyle(
                  color: AnonUTheme.maroon,
                  fontSize: 28,
                  fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            user.pseudonym,
            style: const TextStyle(
              color: AnonUTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (user.displayName != null) ...[
            const SizedBox(height: 2),
            Text(
              user.displayName!,
              style: const TextStyle(
                  color: AnonUTheme.textSecondary, fontSize: 13.5),
            ),
          ],
          const SizedBox(height: 4),
          Text(
            user.email,
            style: const TextStyle(color: AnonUTheme.textMuted, fontSize: 12),
          ),
          if (user.currentStreak > 0) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: AnonUTheme.maroon.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '🔥 ${user.currentStreak}-day check-in streak',
                style: const TextStyle(
                    color: AnonUTheme.maroon,
                    fontSize: 12,
                    fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final UserModel user;
  const _StatsRow({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 1),
      padding: const EdgeInsets.symmetric(vertical: 16),
      color: AnonUTheme.surface,
      child: Row(
        children: [
          _Stat(value: user.postCount.toString(), label: 'Posts'),
          _Stat(value: user.upvotesReceived.toString(), label: 'Upvotes'),
          _Stat(
              value: user.longestStreak.toString(), label: 'Best streak 🔥'),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;
  const _Stat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(
                  color: AnonUTheme.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  color: AnonUTheme.textMuted, fontSize: 11.5)),
        ],
      ),
    );
  }
}

// ── Notifications Screen ──────────────────────────────────────────────────
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uid = ref.read(authServiceProvider).currentUser?.uid;

    final notifStream = ref.watch(
      StreamProvider<List<NotificationModel>>((ref) {
        if (uid == null) return Stream.value([]);
        return FirebaseFirestore.instance
            .collection('notifications')
            .where('recipientUid', isEqualTo: uid)
            .orderBy('createdAt', descending: true)
            .limit(50)
            .snapshots()
            .map((s) => s.docs
                .map((d) => NotificationModel.fromFirestore(d))
                .toList());
      }),
    );

    return Scaffold(
      backgroundColor: AnonUTheme.background,
      appBar: AppBar(title: const Text('Notifications')),
      body: notifStream.when(
        data: (notifs) {
          if (notifs.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('🔔', style: TextStyle(fontSize: 40)),
                  SizedBox(height: 12),
                  Text('No notifications yet',
                      style: TextStyle(color: AnonUTheme.textMuted)),
                ],
              ),
            );
          }
          return ListView.builder(
            itemCount: notifs.length,
            itemBuilder: (_, i) => _NotifTile(
              notif: notifs[i],
              onTap: () {
                if (notifs[i].postId != null) {
                  context.push('/post/${notifs[i].postId}');
                }
                // Mark as read
                FirebaseFirestore.instance
                    .collection('notifications')
                    .doc(notifs[i].id)
                    .update({'isRead': true});
              },
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AnonUTheme.maroon),
        ),
        error: (_, __) => const Center(
          child: Text('Error loading notifications',
              style: TextStyle(color: AnonUTheme.textMuted)),
        ),
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final NotificationModel notif;
  final VoidCallback onTap;

  const _NotifTile({required this.notif, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: BoxDecoration(
          color: notif.isRead ? AnonUTheme.background : AnonUTheme.surface,
          border: const Border(
              bottom: BorderSide(color: AnonUTheme.border, width: 0.5)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AnonUTheme.surfaceVariant,
              child: Text(_notifIcon, style: const TextStyle(fontSize: 14)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notif.message,
                    style: TextStyle(
                      color: AnonUTheme.textPrimary,
                      fontSize: 13.5,
                      fontWeight: notif.isRead ? FontWeight.normal : FontWeight.w600,
                    ),
                  ),
                  if (notif.postPreview != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      notif.postPreview!,
                      style: const TextStyle(
                          color: AnonUTheme.textMuted, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (!notif.isRead)
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: AnonUTheme.maroon,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String get _notifIcon {
    switch (notif.type) {
      case NotificationType.upvote: return '⬆️';
      case NotificationType.comment: return '💬';
      case NotificationType.reply: return '↩️';
      case NotificationType.repost: return '🔁';
      case NotificationType.mention: return '@';
    }
  }
}
