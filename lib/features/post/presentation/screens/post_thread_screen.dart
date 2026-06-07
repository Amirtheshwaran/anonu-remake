import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/constants/constants.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/widgets/post_card.dart';

// ── Post Thread Screen ──────────────────────────────────────────────────────
class PostThreadScreen extends ConsumerStatefulWidget {
  final String postId;
  const PostThreadScreen({super.key, required this.postId});

  @override
  ConsumerState<PostThreadScreen> createState() => _PostThreadScreenState();
}

class _PostThreadScreenState extends ConsumerState<PostThreadScreen> {
  final _commentController = TextEditingController();
  PostIdentity _commentIdentity = PostIdentity.anonymous;
  bool _submitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final postStream = ref.watch(
      StreamProvider.family<PostModel?, String>(
        (ref, id) => ref.read(postServiceProvider).postStream(id),
      )(widget.postId),
    );

    final commentsStream = ref.watch(
      StreamProvider.family<List<CommentModel>, String>(
        (ref, id) => ref.read(postServiceProvider).commentsStream(id),
      )(widget.postId),
    );

    return Scaffold(
      backgroundColor: AnonUTheme.background,
      appBar: AppBar(title: const Text('Post')),
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                // Post
                SliverToBoxAdapter(
                  child: postStream.when(
                    data: (post) => post == null
                        ? const SizedBox.shrink()
                        : FutureBuilder<bool?>(
                            future: ref.read(postServiceProvider).getUserVote(post.id),
                            builder: (_, snap) => PostCard(
                              post: post,
                              userVote: snap.data,
                              isDetail: true,
                              onUpvote: () => ref.read(postServiceProvider).vote(post, true),
                              onDownvote: () => ref.read(postServiceProvider).vote(post, false),
                              onComment: () {},
                              onRepost: () => _repost(post),
                              onReport: () => _report(post.id),
                              onPollVote: (i) => ref.read(postServiceProvider).votePoll(post.id, i),
                            ),
                          ),
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),

                // Comments header
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'Comments',
                      style: TextStyle(
                        color: AnonUTheme.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),

                // Comments
                commentsStream.when(
                  data: (comments) => SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _CommentTile(comment: comments[i]),
                      childCount: comments.length,
                    ),
                  ),
                  loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                  error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
                ),
              ],
            ),
          ),

          // ── Comment input ────────────────────────────────────
          _CommentInput(
            controller: _commentController,
            identity: _commentIdentity,
            submitting: _submitting,
            onIdentityToggle: () => setState(() {
              _commentIdentity = _commentIdentity == PostIdentity.anonymous
                  ? PostIdentity.identified
                  : PostIdentity.anonymous;
            }),
            onSubmit: _submitComment,
          ),
        ],
      ),
    );
  }

  Future<void> _submitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || _submitting) return;

    setState(() => _submitting = true);
    try {
      final user = await ref.read(authServiceProvider)
          .getUser(ref.read(authServiceProvider).currentUser!.uid);
      await ref.read(postServiceProvider).addComment(
        postId: widget.postId,
        content: text,
        identity: _commentIdentity,
        currentUser: user,
      );
      _commentController.clear();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _repost(PostModel post) async {
    final user = await ref
        .read(authServiceProvider)
        .getUser(ref.read(authServiceProvider).currentUser!.uid);
    if (user != null) {
      await ref.read(postServiceProvider).repost(post, user);
    }
  }

  Future<void> _report(String postId) async {
    await ref.read(postServiceProvider).reportPost(postId, 'Reported from thread');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reported. Thanks.')),
      );
    }
  }
}

class _CommentTile extends StatelessWidget {
  final CommentModel comment;
  const _CommentTile({required this.comment});

  @override
  Widget build(BuildContext context) {
    final name = comment.isAnonymous
        ? comment.pseudonym
        : (comment.displayName ?? comment.pseudonym);

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AnonUTheme.border, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: AnonUTheme.surfaceVariant,
            child: Text(
              name[0],
              style: const TextStyle(
                  color: AnonUTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: AnonUTheme.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (comment.isAnonymous) ...[
                      const SizedBox(width: 5),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: AnonUTheme.anonGreen.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('anon',
                            style: TextStyle(
                                color: AnonUTheme.anonGreen,
                                fontSize: 9,
                                fontWeight: FontWeight.w600)),
                      ),
                    ],
                    const Spacer(),
                    Text(
                      _formatTime(comment.createdAt),
                      style: const TextStyle(
                          color: AnonUTheme.textMuted, fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment.content,
                  style: const TextStyle(
                    color: AnonUTheme.textPrimary,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

class _CommentInput extends StatelessWidget {
  final TextEditingController controller;
  final PostIdentity identity;
  final bool submitting;
  final VoidCallback onIdentityToggle;
  final VoidCallback onSubmit;

  const _CommentInput({
    required this.controller,
    required this.identity,
    required this.submitting,
    required this.onIdentityToggle,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 8, 12, MediaQuery.of(context).viewInsets.bottom + 8),
      decoration: const BoxDecoration(
        color: AnonUTheme.surface,
        border: Border(top: BorderSide(color: AnonUTheme.border)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: onIdentityToggle,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: AnonUTheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                identity == PostIdentity.anonymous ? '🎭' : '👤',
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              style: const TextStyle(color: AnonUTheme.textPrimary, fontSize: 14),
              maxLines: null,
              maxLength: AnonUConstants.maxCommentLength,
              decoration: const InputDecoration(
                hintText: 'Add a comment...',
                counterText: '',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: submitting ? null : onSubmit,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AnonUTheme.maroon,
                borderRadius: BorderRadius.circular(8),
              ),
              child: submitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded,
                      color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Search Screen ──────────────────────────────────────────────────────────
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  List<PostModel> _results = [];
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AnonUTheme.background,
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          style: const TextStyle(color: AnonUTheme.textPrimary),
          decoration: const InputDecoration(
            hintText: 'Search tags or content...',
            border: InputBorder.none,
            filled: false,
          ),
          onSubmitted: _search,
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Suggested tags
          if (_results.isEmpty && !_loading) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text('Popular tags',
                  style: TextStyle(
                      color: AnonUTheme.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: AnonUConstants.suggestedTags
                    .map((t) => TagChipClickable(
                          tag: t,
                          onTap: () {
                            _searchController.text = t;
                            _search(t);
                          },
                        ))
                    .toList(),
              ),
            ),
          ],

          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: AnonUTheme.maroon),
              ),
            ),

          if (_results.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: _results.length,
                itemBuilder: (_, i) {
                  final post = _results[i];
                  return PostCard(
                    post: post,
                    onTap: () => context.push('/post/${post.id}'),
                    onUpvote: () => ref.read(postServiceProvider).vote(post, true),
                    onDownvote: () => ref.read(postServiceProvider).vote(post, false),
                    onComment: () => context.push('/post/${post.id}'),
                    onRepost: () => _repost(post),
                    onReport: () => _report(post.id),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) return;
    setState(() => _loading = true);
    final results =
        await ref.read(postServiceProvider).searchPosts(query.trim().toLowerCase());
    setState(() {
      _results = results;
      _loading = false;
    });
  }

  Future<void> _repost(PostModel post) async {
    final user = await ref
        .read(authServiceProvider)
        .getUser(ref.read(authServiceProvider).currentUser!.uid);
    if (user != null) {
      await ref.read(postServiceProvider).repost(post, user);
    }
  }

  Future<void> _report(String postId) async {
    await ref.read(postServiceProvider).reportPost(postId, 'Reported from search');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reported. Thanks.')),
      );
    }
  }
}

class TagChipClickable extends StatelessWidget {
  final String tag;
  final VoidCallback onTap;
  const TagChipClickable({super.key, required this.tag, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AnonUTheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AnonUTheme.border),
        ),
        child: Text('#$tag',
            style: const TextStyle(
                color: AnonUTheme.textSecondary, fontSize: 13)),
      ),
    );
  }
}
