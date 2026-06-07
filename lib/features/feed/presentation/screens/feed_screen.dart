import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/theme/app_theme.dart';
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AnonUTheme.background,
      appBar: AppBar(
        title: const Text(
          'AnonU',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            color: AnonUTheme.maroon,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: AnonUTheme.textSecondary),
            onPressed: () => context.push('/search'),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AnonUTheme.maroon,
          indicatorWeight: 2,
          labelColor: AnonUTheme.textPrimary,
          unselectedLabelColor: AnonUTheme.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: const [
            Tab(text: '🔥 Hot'),
            Tab(text: 'New'),
            Tab(text: 'Top'),
          ],
        ),
      ),
      body: Column(
        children: [
          const MoodBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _sorts
                  .map((sort) => _FeedList(sort: sort))
                  .toList(),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/compose'),
        backgroundColor: AnonUTheme.maroon,
        child: const Icon(Icons.edit_rounded, color: Colors.white),
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
      loading: () => const _ShimmerList(),
      error: (e, _) => Center(
        child: Text('Error: $e',
            style: const TextStyle(color: AnonUTheme.textSecondary)),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return const Center(
            child: Text('No posts yet. Be the first.',
                style: TextStyle(color: AnonUTheme.textMuted)),
          );
        }
        return RefreshIndicator(
          color: AnonUTheme.maroon,
          backgroundColor: AnonUTheme.surface,
          onRefresh: () async {
            ref.invalidate(feedProvider(sort));
          },
          child: ListView.builder(
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
      builder: (_) => AlertDialog(
        backgroundColor: AnonUTheme.surface,
        title: const Text('Repost?',
            style: TextStyle(color: AnonUTheme.textPrimary)),
        content: const Text('This will repost anonymously to your feed.',
            style: TextStyle(color: AnonUTheme.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel',
                style: TextStyle(color: AnonUTheme.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Repost',
                style: TextStyle(color: AnonUTheme.anonGreen)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final user = await ref.read(authServiceProvider).getUser(
          ref.read(authServiceProvider).currentUser!.uid);
      await ref.read(postServiceProvider).repost(post, user!);
    }
  }

  Future<void> _handleReport(
      BuildContext context, PostService service, String postId) async {
    final reasons = ['Harassment', 'Misinformation', 'Spam', 'Inappropriate content'];
    String? selected;

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AnonUTheme.surface,
        title: const Text('Report Post',
            style: TextStyle(color: AnonUTheme.textPrimary)),
        content: StatefulBuilder(builder: (ctx, setState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: reasons.map((r) {
              return RadioListTile<String>(
                value: r,
                groupValue: selected,
                onChanged: (v) => setState(() => selected = v),
                title: Text(r,
                    style: const TextStyle(color: AnonUTheme.textPrimary, fontSize: 14)),
                activeColor: AnonUTheme.maroon,
              );
            }).toList(),
          );
        }),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel',
                style: TextStyle(color: AnonUTheme.textMuted)),
          ),
          TextButton(
            onPressed: () {
              if (selected != null) {
                service.reportPost(postId, selected!);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reported. Thanks.')),
                );
              }
            },
            child: const Text('Submit',
                style: TextStyle(color: AnonUTheme.maroon)),
          ),
        ],
      ),
    );
  }
}

class _ShimmerList extends StatelessWidget {
  const _ShimmerList();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 6,
      itemBuilder: (_, __) => const _ShimmerCard(),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 1),
      color: AnonUTheme.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _shimmerBox(36, 36, circular: true),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _shimmerBox(12, 120),
              const SizedBox(height: 4),
              _shimmerBox(10, 60),
            ]),
          ]),
          const SizedBox(height: 12),
          _shimmerBox(14, double.infinity),
          const SizedBox(height: 6),
          _shimmerBox(14, 200),
        ],
      ),
    );
  }

  Widget _shimmerBox(double h, double w, {bool circular = false}) {
    return Container(
      height: h,
      width: w == double.infinity ? null : w,
      decoration: BoxDecoration(
        color: AnonUTheme.surfaceVariant,
        borderRadius: BorderRadius.circular(circular ? h / 2 : 4),
      ),
    );
  }
}
