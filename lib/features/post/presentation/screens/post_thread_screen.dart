import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/constants/constants.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/services/pseudonym_service.dart';
import 'package:anonu/shared/widgets/post_card.dart';

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
  CommentModel? _replyingTo;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _startReply(CommentModel parent) {
    setState(() {
      _replyingTo = parent;
    });
  }

  void _cancelReply() {
    setState(() {
      _replyingTo = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final postService = ref.read(postServiceProvider);

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
      backgroundColor: AnonUTheme.bgCream,
      appBar: AppBar(
        backgroundColor: AnonUTheme.bgCream,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Center(
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AnonUTheme.bgSurface,
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                  border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                  boxShadow: const [
                    BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                  ],
                ),
                child: const Icon(Icons.arrow_back_rounded, size: 20, color: AnonUTheme.black),
              ),
            ),
          ),
        ),
        title: const Text('CAMPUS THREAD'),
      ),
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                // ── Original Post (Expanded View) ─────────────────────
                SliverToBoxAdapter(
                  child: postStream.when(
                    data: (post) => post == null
                        ? const SizedBox.shrink()
                        : FutureBuilder<bool?>(
                            future: postService.getUserVote(post.id),
                            builder: (_, snap) => PostCard(
                              post: post,
                              userVote: snap.data,
                              isDetail: true,
                              onUpvote: () => postService.vote(post, true),
                              onDownvote: () => postService.vote(post, false),
                              onComment: () {},
                              onRepost: () => _repost(post),
                              onReport: () => _report(post.id),
                              onPollVote: (i) => postService.votePoll(post.id, i),
                            ),
                          ),
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: CircularProgressIndicator(color: AnonUTheme.black),
                      ),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),

                // ── Comments Section Header ───────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
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
                            'DISCUSSION',
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 10.5,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'CAMPUS REPLIES',
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

                // ── Nested Comments List ──────────────────────────────
                commentsStream.when(
                  data: (comments) {
                    if (comments.isEmpty) {
                      return SliverToBoxAdapter(
                        child: Center(
                          child: BrutalistCard(
                            margin: const EdgeInsets.all(20),
                            padding: const EdgeInsets.all(16),
                            backgroundColor: AnonUTheme.bgSurface,
                            child: const Column(
                              children: [
                                Icon(Icons.chat_bubble_outline_rounded, size: 28, color: AnonUTheme.black),
                                SizedBox(height: 6),
                                Text(
                                  'NO COMMENTS YET',
                                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Drop your thoughts anonymously or identified.',
                                  style: TextStyle(color: AnonUTheme.textSecondary, fontSize: 11.5),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }

                    // Organize into top-level and children
                    final rootComments = comments.where((c) => c.parentCommentId == null).toList();
                    final repliesMap = <String, List<CommentModel>>{};
                    for (final c in comments) {
                      if (c.parentCommentId != null) {
                        repliesMap.putIfAbsent(c.parentCommentId!, () => []).add(c);
                      }
                    }

                    return SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) {
                          final root = rootComments[i];
                          final replies = repliesMap[root.id] ?? [];
                          return _NestedCommentTree(
                            comment: root,
                            replies: replies,
                            onReply: _startReply,
                          );
                        },
                        childCount: rootComments.length,
                      ),
                    );
                  },
                  loading: () => const SliverToBoxAdapter(
                    child: Center(child: CircularProgressIndicator(color: AnonUTheme.black)),
                  ),
                  error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 20)),
              ],
            ),
          ),

          // ── Replying Banner ──────────────────────────────────────────
          if (_replyingTo != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: const BoxDecoration(
                color: AnonUTheme.popYellow,
                border: Border(
                  top: BorderSide(color: AnonUTheme.black, width: 2),
                  bottom: BorderSide(color: AnonUTheme.black, width: 2),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.reply_rounded, size: 16, color: AnonUTheme.black),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'REPLYING TO @${_replyingTo!.pseudonym.toUpperCase()}: "${_replyingTo!.content}"',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AnonUTheme.black,
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _cancelReply,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: AnonUTheme.black,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ── Brutalist Comment Composer ───────────────────────────────
          _BrutalistCommentInput(
            controller: _commentController,
            identity: _commentIdentity,
            submitting: _submitting,
            replyingToName: _replyingTo?.pseudonym,
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
        parentCommentId: _replyingTo?.id,
        currentUser: user,
      );
      _commentController.clear();
      _cancelReply();
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AnonUTheme.popMint,
            content: Text('Reposted anonymously to campus!', style: TextStyle(color: AnonUTheme.black, fontWeight: FontWeight.w800)),
          ),
        );
      }
    }
  }

  Future<void> _report(String postId) async {
    await ref.read(postServiceProvider).reportPost(postId, 'Reported from thread');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AnonUTheme.popMint,
          content: Text('Report logged. Thanks.', style: TextStyle(color: AnonUTheme.black, fontWeight: FontWeight.w800)),
        ),
      );
    }
  }
}

class _NestedCommentTree extends StatelessWidget {
  final CommentModel comment;
  final List<CommentModel> replies;
  final ValueChanged<CommentModel> onReply;

  const _NestedCommentTree({
    required this.comment,
    required this.replies,
    required this.onReply,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _CommentCard(comment: comment, onReply: () => onReply(comment)),
        if (replies.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(left: 28),
            child: Container(
              decoration: const BoxDecoration(
                border: Border(
                  left: BorderSide(color: AnonUTheme.black, width: 2.5),
                ),
              ),
              child: Column(
                children: replies.map((reply) {
                  return Padding(
                    padding: const EdgeInsets.only(left: 10),
                    child: _CommentCard(
                      comment: reply,
                      isReply: true,
                      onReply: () => onReply(comment),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _CommentCard extends StatelessWidget {
  final CommentModel comment;
  final bool isReply;
  final VoidCallback onReply;

  const _CommentCard({
    required this.comment,
    this.isReply = false,
    required this.onReply,
  });

  @override
  Widget build(BuildContext context) {
    final name = comment.isAnonymous
        ? comment.pseudonym
        : (comment.displayName ?? comment.pseudonym);
    final avatarColor = PseudonymService.colorForPseudonym(comment.pseudonym);

    return BrutalistCard(
      margin: EdgeInsets.fromLTRB(isReply ? 4 : 14, 4, 14, 4),
      padding: const EdgeInsets.all(12),
      backgroundColor: isReply ? AnonUTheme.bgCream : AnonUTheme.bgSurface,
      borderWidth: AnonUTheme.borderWidthThin,
      shadowOffset: const Offset(2, 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: avatarColor,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AnonUTheme.black, width: 1.5),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: AnonUTheme.black,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (comment.isAnonymous)
                const BrutalistBadge(
                  label: 'ANON',
                  backgroundColor: AnonUTheme.popMint,
                  fontSize: 8.5,
                  borderWidth: 1.5,
                  hasShadow: false,
                ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onReply,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AnonUTheme.bgCream,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AnonUTheme.black, width: 1.5),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.reply_rounded, size: 12, color: AnonUTheme.black),
                      SizedBox(width: 2),
                      Text(
                        'REPLY',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            comment.content,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              height: 1.35,
              color: AnonUTheme.black,
            ),
          ),
        ],
      ),
    );
  }
}

class _BrutalistCommentInput extends StatelessWidget {
  final TextEditingController controller;
  final PostIdentity identity;
  final bool submitting;
  final String? replyingToName;
  final VoidCallback onIdentityToggle;
  final VoidCallback onSubmit;

  const _BrutalistCommentInput({
    required this.controller,
    required this.identity,
    required this.submitting,
    this.replyingToName,
    required this.onIdentityToggle,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        12,
        8,
        12,
        MediaQuery.of(context).viewInsets.bottom + 10,
      ),
      decoration: const BoxDecoration(
        color: AnonUTheme.bgSurface,
        border: Border(top: BorderSide(color: AnonUTheme.black, width: 2.5)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            // Identity sticker toggle
            GestureDetector(
              onTap: onIdentityToggle,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                decoration: BoxDecoration(
                  color: identity == PostIdentity.anonymous ? AnonUTheme.popMint : AnonUTheme.popYellow,
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                  border: Border.all(color: AnonUTheme.black, width: 2),
                  boxShadow: const [
                    BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                  ],
                ),
                child: Row(
                  children: [
                    Text(identity == PostIdentity.anonymous ? '🎭' : '👤', style: const TextStyle(fontSize: 14)),
                    const SizedBox(width: 4),
                    Text(
                      identity == PostIdentity.anonymous ? 'ANON' : 'IDENTIFIED',
                      style: const TextStyle(
                        color: AnonUTheme.black,
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Text Field
            Expanded(
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: AnonUTheme.bgCream,
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                  border: Border.all(color: AnonUTheme.black, width: 2),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 10),
                alignment: Alignment.center,
                child: TextField(
                  controller: controller,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                  maxLength: AnonUConstants.maxCommentLength,
                  decoration: InputDecoration(
                    hintText: replyingToName != null
                        ? 'Reply to @$replyingToName...'
                        : 'Say something on campus...',
                    hintStyle: const TextStyle(color: AnonUTheme.textMuted, fontSize: 13),
                    counterText: '',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Send button
            GestureDetector(
              onTap: submitting ? null : onSubmit,
              child: Container(
                height: 42,
                width: 44,
                decoration: BoxDecoration(
                  color: AnonUTheme.popYellow,
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                  border: Border.all(color: AnonUTheme.black, width: 2),
                  boxShadow: const [
                    BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                  ],
                ),
                alignment: Alignment.center,
                child: submitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AnonUTheme.black),
                      )
                    : const Icon(Icons.send_rounded, color: AnonUTheme.black, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
