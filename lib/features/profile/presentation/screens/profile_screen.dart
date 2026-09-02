import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/models/user_model.dart';
import 'package:anonu/shared/services/pseudonym_service.dart';
import 'package:anonu/shared/widgets/post_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).value;
    if (user == null) {
      return const Scaffold(
        backgroundColor: AnonUTheme.bgCream,
        body: Center(
          child: CircularProgressIndicator(strokeWidth: 3, color: AnonUTheme.black),
        ),
      );
    }

    final postsStream = ref.watch(
      StreamProvider<List<PostModel>>((ref) =>
          ref.read(postServiceProvider).userPostsStream(user.uid)),
    );

    return Scaffold(
      backgroundColor: AnonUTheme.bgCream,
      appBar: AppBar(
        backgroundColor: AnonUTheme.bgCream,
        title: const Text('CAMPUS IDENTITY'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: BrutalistButton(
              text: 'LOG OUT',
              backgroundColor: AnonUTheme.downvoteRed,
              textColor: Colors.white,
              shadowOffset: const Offset(2, 2),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              onPressed: () async {
                await ref.read(authServiceProvider).signOut();
                if (context.mounted) context.go('/auth');
              },
            ),
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _BrutalistProfileHeader(user: user)),
          SliverToBoxAdapter(child: _BrutalistStatsRow(user: user)),
          SliverToBoxAdapter(child: _BrutalistProfileActions(user: user)),
          if (user.isModerator) SliverToBoxAdapter(child: _BrutalistModeratorPanel(user: user)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AnonUTheme.popYellow,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AnonUTheme.black, width: 1.5),
                    ),
                    child: const Text(
                      'ARCHIVE',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 10.5,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'YOUR PUBLICATIONS',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 12.5,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          postsStream.when(
            data: (posts) {
              if (posts.isEmpty) {
                return SliverToBoxAdapter(
                  child: Center(
                    child: BrutalistCard(
                      margin: const EdgeInsets.all(20),
                      padding: const EdgeInsets.all(20),
                      backgroundColor: AnonUTheme.bgSurface,
                      child: const Column(
                        children: [
                          Icon(Icons.history_edu_rounded, size: 32, color: AnonUTheme.black),
                          SizedBox(height: 6),
                          Text(
                            'NO POSTS PUBLISHED YET',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Your anonymous and identified campus posts will be indexed here.',
                            style: TextStyle(color: AnonUTheme.textSecondary, fontSize: 11.5),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => PostCard(
                    post: posts[i],
                    onTap: () => context.push('/post/${posts[i].id}'),
                    onUpvote: () => ref.read(postServiceProvider).vote(posts[i], true),
                    onDownvote: () => ref.read(postServiceProvider).vote(posts[i], false),
                    onComment: () => context.push('/post/${posts[i].id}'),
                    onRepost: () => ref.read(postServiceProvider).repost(posts[i], user),
                    onReport: () => ref.read(postServiceProvider).reportPost(posts[i].id, 'Profile report'),
                  ),
                  childCount: posts.length,
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: Center(child: CircularProgressIndicator(color: AnonUTheme.black)),
            ),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }
}

class _BrutalistProfileHeader extends StatelessWidget {
  final UserModel user;
  const _BrutalistProfileHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    final avatarColor = PseudonymService.colorForPseudonym(user.pseudonym);

    return BrutalistCard(
      margin: const EdgeInsets.fromLTRB(14, 10, 14, 8),
      padding: const EdgeInsets.all(16),
      backgroundColor: AnonUTheme.bgSurface,
      child: Row(
        children: [
          // Avatar
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: avatarColor,
              borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
              border: Border.all(color: AnonUTheme.black, width: 2.5),
              boxShadow: const [
                BoxShadow(color: AnonUTheme.black, offset: Offset(2.5, 2.5), blurRadius: 0),
              ],
            ),
            child: user.hasIdentifiedProfile && user.avatarUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
                    child: CachedNetworkImage(imageUrl: user.avatarUrl!, fit: BoxFit.cover),
                  )
                : Center(
                    child: Text(
                      user.pseudonym.split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join().toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22),
                    ),
                  ),
          ),
          const SizedBox(width: 16),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.pseudonym,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const BrutalistBadge(
                      label: 'PERM MASK',
                      backgroundColor: AnonUTheme.popMint,
                      fontSize: 9,
                      borderWidth: 1.5,
                      hasShadow: false,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                if (user.hasIdentifiedProfile)
                  Text(
                    'Real Name: ${user.displayName}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: AnonUTheme.textSecondary,
                    ),
                  )
                else
                  const Text(
                    'Real Name: Not configured yet',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      color: AnonUTheme.textMuted,
                    ),
                  ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AnonUTheme.bgCream,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AnonUTheme.black, width: 1),
                  ),
                  child: Text(
                    user.email.isNotEmpty ? user.email : 'GUEST ANONYMOUS SESSION',
                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BrutalistStatsRow extends StatelessWidget {
  final UserModel user;
  const _BrutalistStatsRow({required this.user});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: _StatCard(
              value: '${user.postCount}',
              label: 'PUBLICATIONS',
              accentColor: AnonUTheme.popYellow,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _StatCard(
              value: '${user.upvotesReceived}',
              label: 'UPVOTES',
              accentColor: AnonUTheme.popMint,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _StatCard(
              value: '${user.longestStreak}🔥',
              label: 'BEST STREAK',
              accentColor: AnonUTheme.popOrange,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final Color accentColor;

  const _StatCard({
    required this.value,
    required this.label,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return BrutalistCard(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      backgroundColor: AnonUTheme.bgSurface,
      borderWidth: AnonUTheme.borderWidthThin,
      shadowOffset: const Offset(2, 2),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AnonUTheme.black,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
              color: AnonUTheme.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _BrutalistProfileActions extends ConsumerWidget {
  final UserModel user;
  const _BrutalistProfileActions({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 6),
      child: BrutalistButton(
        text: 'EDIT IDENTIFIED PROFILE',
        icon: const Icon(Icons.badge_outlined, size: 18, color: AnonUTheme.black),
        backgroundColor: AnonUTheme.popCyan,
        isFullWidth: true,
        shadowOffset: const Offset(2.5, 2.5),
        onPressed: () => _showEditProfile(context, ref),
      ),
    );
  }

  Future<void> _showEditProfile(BuildContext context, WidgetRef ref) async {
    final nameController = TextEditingController(text: user.displayName ?? '');
    final avatarController = TextEditingController(text: user.avatarUrl ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: BrutalistCard(
          padding: const EdgeInsets.all(20),
          backgroundColor: AnonUTheme.bgSurface,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  Icon(Icons.badge_rounded, size: 22, color: AnonUTheme.black),
                  SizedBox(width: 8),
                  Text(
                    'IDENTIFIED PROFILE',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Configure your real name and avatar for identified campus posts.',
                style: TextStyle(color: AnonUTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              const Text('DISPLAY NAME', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
              const SizedBox(height: 4),
              BrutalistTextField(controller: nameController, hintText: 'e.g. Alex Johnson'),
              const SizedBox(height: 12),
              const Text('AVATAR IMAGE URL', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
              const SizedBox(height: 4),
              BrutalistTextField(controller: avatarController, hintText: 'https://example.com/avatar.jpg'),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  BrutalistButton(
                    text: 'CANCEL',
                    backgroundColor: const Color(0xFFE5E2D9),
                    shadowOffset: const Offset(2, 2),
                    onPressed: () => Navigator.pop(context, false),
                  ),
                  const SizedBox(width: 10),
                  BrutalistButton(
                    text: 'SAVE CHANGES',
                    backgroundColor: AnonUTheme.popYellow,
                    shadowOffset: const Offset(2, 2),
                    onPressed: () => Navigator.pop(context, true),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (saved == true) {
      await ref.read(authServiceProvider).updateProfile(
            displayName: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
            avatarUrl: avatarController.text.trim().isEmpty ? null : avatarController.text.trim(),
          );
      ref.invalidate(currentUserProvider);
    }
  }
}

class _BrutalistModeratorPanel extends ConsumerWidget {
  final UserModel user;
  const _BrutalistModeratorPanel({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reports = ref.watch(
      StreamProvider((ref) => ref.read(postServiceProvider).reportsStream()),
    );

    return BrutalistCard(
      margin: const EdgeInsets.fromLTRB(14, 8, 14, 8),
      padding: const EdgeInsets.all(16),
      backgroundColor: const Color(0xFFFFF7EA),
      borderWidth: AnonUTheme.borderWidth,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AnonUTheme.downvoteRed,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AnonUTheme.black, width: 1.5),
                ),
                child: const Icon(Icons.shield_rounded, size: 16, color: Colors.white),
              ),
              const SizedBox(width: 8),
              const Text(
                'CAMPUS MODERATOR QUEUE',
                style: TextStyle(
                  color: AnonUTheme.black,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          reports.when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => Text('$e', style: const TextStyle(color: AnonUTheme.downvoteRed)),
            data: (items) {
              if (items.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AnonUTheme.bgCream,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AnonUTheme.black, width: 1),
                  ),
                  child: const Text(
                    'No open incident reports. Campus is clean.',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                );
              }
              return Column(
                children: items.take(5).map((report) {
                  final postId = report['postId'] as String?;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AnonUTheme.bgSurface,
                      borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                      border: Border.all(color: AnonUTheme.black, width: 1.5),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Reason: ${report["reason"]}',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                              ),
                              Text(
                                'Post ID: $postId',
                                style: const TextStyle(color: AnonUTheme.textMuted, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        // Action buttons
                        BrutalistButton(
                          text: 'DISMISS',
                          backgroundColor: AnonUTheme.bgCream,
                          shadowOffset: const Offset(1.5, 1.5),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          onPressed: () => ref.read(postServiceProvider).resolveReport(report['id'] as String),
                        ),
                        const SizedBox(width: 6),
                        BrutalistButton(
                          text: 'HIDE POST',
                          backgroundColor: AnonUTheme.downvoteRed,
                          textColor: Colors.white,
                          shadowOffset: const Offset(1.5, 1.5),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
