import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/mood/mood_bar.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/services/auth_service.dart';
import 'package:anonu/shared/services/post_service.dart';
import 'package:anonu/shared/widgets/post_card.dart';

final postServiceProvider = Provider((_) => PostService());
final authServiceProvider = Provider((_) => AuthService());

final feedProvider = StreamProvider.family<List<PostModel>, FeedSort>(
  (ref, sort) => ref.read(postServiceProvider).feedStream(sort),
);

final currentUserProvider = StreamProvider((ref) {
  final auth = ref.read(authServiceProvider);
  final uid = auth.currentUser?.uid;
  if (uid == null) return Stream.value(null);
  return auth.userStream(uid);
});

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _sorts = [FeedSort.hot, FeedSort.recent, FeedSort.top];
  int _selectedTabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() => _selectedTabIndex = _tabController.index);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AnonUTheme.bgCream,
      appBar: AppBar(
        backgroundColor: AnonUTheme.bgCream,
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AnonUTheme.popYellow,
                borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                boxShadow: const [
                  BoxShadow(
                    color: AnonUTheme.black,
                    offset: Offset(2, 2),
                    blurRadius: 0,
                  ),
                ],
              ),
              child: const Text(
                'AnonU',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  color: AnonUTheme.black,
                ),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: GestureDetector(
              onTap: () => context.push('/search'),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AnonUTheme.bgSurface,
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                  border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                  boxShadow: const [
                    BoxShadow(
                      color: AnonUTheme.black,
                      offset: Offset(2, 2),
                      blurRadius: 0,
                    ),
                  ],
                ),
                child: const Icon(Icons.search_rounded, color: AnonUTheme.black, size: 20),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Campus Mood Bar ──────────────────────────────────────────
          const MoodBar(),

          // ── Neo-Brutalist Segmented Feed Tabs ────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
            child: Container(
              decoration: BoxDecoration(
                color: AnonUTheme.bgSurface,
                borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                boxShadow: const [
                  BoxShadow(
                    color: AnonUTheme.black,
                    offset: Offset(2.5, 2.5),
                    blurRadius: 0,
                  ),
                ],
              ),
              padding: const EdgeInsets.all(4),
              child: Row(
                children: [
                  _FeedTabItem(
                    label: '🔥 HOT',
                    isSelected: _selectedTabIndex == 0,
                    onTap: () {
                      _tabController.animateTo(0);
                      setState(() => _selectedTabIndex = 0);
                    },
                  ),
                  _FeedTabItem(
                    label: '⚡ NEW',
                    isSelected: _selectedTabIndex == 1,
                    onTap: () {
                      _tabController.animateTo(1);
                      setState(() => _selectedTabIndex = 1);
                    },
                  ),
                  _FeedTabItem(
                    label: '🏆 TOP',
                    isSelected: _selectedTabIndex == 2,
                    onTap: () {
                      _tabController.animateTo(2);
                      setState(() => _selectedTabIndex = 2);
                    },
                  ),
                ],
              ),
            ),
          ),

          // ── Feed View ────────────────────────────────────────────────
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _sorts.map((sort) => _FeedList(sort: sort)).toList(),
            ),
          ),
        ],
      ),
      floatingActionButton: GestureDetector(
        onTap: () => context.push('/compose'),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            color: AnonUTheme.popYellow,
            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
            border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidth),
            boxShadow: const [
              BoxShadow(
                color: AnonUTheme.black,
                offset: Offset(3.5, 3.5),
                blurRadius: 0,
              ),
            ],
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.edit_note_rounded, color: AnonUTheme.black, size: 22),
              SizedBox(width: 6),
              Text(
                'POST',
                style: TextStyle(
                  color: AnonUTheme.black,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeedTabItem extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FeedTabItem({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AnonUTheme.popYellow : Colors.transparent,
            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
            border: isSelected
                ? Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin)
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AnonUTheme.black,
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
              fontSize: 12.5,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }
}

class _FeedList extends ConsumerWidget {
  final FeedSort sort;
  const _FeedList({required this.sort});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(feedProvider(sort));
    final postService = ref.read(postServiceProvider);

    return feed.when(
      loading: () => const _BrutalistFeedSkeleton(),
      error: (e, _) => Center(
        child: BrutalistCard(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(16),
          backgroundColor: AnonUTheme.bgSurface,
          child: Text(
            'FEED ERROR: $e',
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              color: AnonUTheme.downvoteRed,
            ),
          ),
        ),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return Center(
            child: BrutalistCard(
              margin: const EdgeInsets.all(32),
              padding: const EdgeInsets.all(24),
              backgroundColor: AnonUTheme.bgSurface,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AnonUTheme.popMint,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AnonUTheme.black, width: 2),
                    ),
                    child: const Icon(Icons.campaign_outlined, size: 36, color: AnonUTheme.black),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'SILENCE ON CAMPUS',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'No posts in this feed yet. Speak up anonymously or identified.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AnonUTheme.textSecondary,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 18),
                  BrutalistButton(
                    text: 'CREATE FIRST POST →',
                    backgroundColor: AnonUTheme.popYellow,
                    onPressed: () => context.push('/compose'),
                  ),
                ],
              ),
            ),
          );
        }
        return RefreshIndicator(
          color: AnonUTheme.black,
          backgroundColor: AnonUTheme.popYellow,
          onRefresh: () async {
            ref.invalidate(feedProvider(sort));
          },
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 4, bottom: 80),
            itemCount: posts.length,
            itemBuilder: (ctx, i) {
              final post = posts[i];
              return FutureBuilder<bool?>(
                future: postService.getUserVote(post.id),
                builder: (context, snap) {
                  return PostCard(
                    post: post,
                    userVote: snap.data,
                    onTap: () => context.push('/post/${post.id}'),
                    onUpvote: () => postService.vote(post, true),
                    onDownvote: () => postService.vote(post, false),
                    onComment: () => context.push('/post/${post.id}'),
                    onRepost: () => _handleRepost(context, ref, post),
                    onReport: () => _handleReport(context, postService, post.id),
                    onPollVote: (idx) => postService.votePoll(post.id, idx),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _handleRepost(
      BuildContext context, WidgetRef ref, PostModel post) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => BrutalistDialog(
        title: 'REPOST ON CAMPUS?',
        message: 'This will repost the publication anonymously to your campus feed under your current pseudonym.',
        confirmLabel: 'REPOST',
        confirmColor: AnonUTheme.popMint,
        onConfirm: () => Navigator.pop(context, true),
      ),
    );
    if (confirmed == true) {
      final user = await ref.read(authServiceProvider).getUser(
          ref.read(authServiceProvider).currentUser!.uid);
      await ref.read(postServiceProvider).repost(post, user!);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AnonUTheme.popMint,
            content: Text(
              'Reposted anonymously to campus!',
              style: TextStyle(color: AnonUTheme.black, fontWeight: FontWeight.w800),
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleReport(
      BuildContext context, PostService service, String postId) async {
    final reasons = [
      'Harassment or Hate',
      'Misinformation',
      'Doxxing / Personal Info',
      'Spam or Scam',
      'Inappropriate Content'
    ];
    String selected = reasons[0];

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: BrutalistCard(
          padding: const EdgeInsets.all(20),
          backgroundColor: AnonUTheme.bgSurface,
          child: StatefulBuilder(builder: (ctx, setState) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AnonUTheme.downvoteRed,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AnonUTheme.black, width: 2),
                      ),
                      child: const Icon(Icons.flag_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'REPORT POST',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  'Select report reason for moderator review:',
                  style: TextStyle(
                    color: AnonUTheme.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 12),
                ...reasons.map((r) {
                  final isChosen = selected == r;
                  return GestureDetector(
                    onTap: () => setState(() => selected = r),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isChosen ? AnonUTheme.popYellow : AnonUTheme.bgCream,
                        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                        border: Border.all(color: AnonUTheme.black, width: 1.5),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isChosen ? Icons.radio_button_checked : Icons.radio_button_off,
                            size: 18,
                            color: AnonUTheme.black,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              r,
                              style: TextStyle(
                                fontWeight: isChosen ? FontWeight.w900 : FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    BrutalistButton(
                      text: 'CANCEL',
                      backgroundColor: const Color(0xFFE5E2D9),
                      shadowOffset: const Offset(2, 2),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 10),
                    BrutalistButton(
                      text: 'SUBMIT REPORT',
                      backgroundColor: AnonUTheme.downvoteRed,
                      textColor: Colors.white,
                      shadowOffset: const Offset(2, 2),
                      onPressed: () async {
                        await service.reportPost(postId, selected);
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: AnonUTheme.popMint,
                              content: Text(
                                'Report sent to moderators. Thank you.',
                                style: TextStyle(color: AnonUTheme.black, fontWeight: FontWeight.w800),
                              ),
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _BrutalistFeedSkeleton extends StatelessWidget {
  const _BrutalistFeedSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 4,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemBuilder: (_, __) => BrutalistCard(
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        padding: const EdgeInsets.all(16),
        backgroundColor: AnonUTheme.bgSurface,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E2D9),
                    borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                    border: Border.all(color: AnonUTheme.black, width: 2),
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 120, height: 14, color: const Color(0xFFE5E2D9)),
                    const SizedBox(height: 4),
                    Container(width: 60, height: 10, color: const Color(0xFFE5E2D9)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(width: double.infinity, height: 14, color: const Color(0xFFE5E2D9)),
            const SizedBox(height: 6),
            Container(width: 240, height: 14, color: const Color(0xFFE5E2D9)),
            const SizedBox(height: 14),
            Container(
              width: 100,
              height: 30,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E2D9),
                border: Border.all(color: AnonUTheme.black, width: 1.5),
                borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
