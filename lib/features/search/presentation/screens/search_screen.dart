import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/constants/constants.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/widgets/post_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  List<PostModel> _results = [];
  bool _loading = false;
  bool _hasSearched = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final postService = ref.read(postServiceProvider);

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
        title: Container(
          height: 42,
          decoration: BoxDecoration(
            color: AnonUTheme.bgSurface,
            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
            border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
            boxShadow: const [
              BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10),
          alignment: Alignment.center,
          child: TextField(
            controller: _searchController,
            autofocus: true,
            style: const TextStyle(
              color: AnonUTheme.black,
              fontWeight: FontWeight.w700,
              fontSize: 14.5,
            ),
            decoration: InputDecoration(
              hintText: 'Search tags or keywords...',
              hintStyle: const TextStyle(color: AnonUTheme.textMuted, fontWeight: FontWeight.w500),
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
              suffixIcon: _searchController.text.isNotEmpty
                  ? GestureDetector(
                      onTap: () {
                        _searchController.clear();
                        setState(() {
                          _results = [];
                          _hasSearched = false;
                        });
                      },
                      child: const Icon(Icons.clear_rounded, size: 18, color: AnonUTheme.black),
                    )
                  : null,
            ),
            onSubmitted: _search,
            onChanged: (v) => setState(() {}),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: BrutalistButton(
              text: 'GO',
              backgroundColor: AnonUTheme.popYellow,
              shadowOffset: const Offset(2, 2),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              onPressed: () => _search(_searchController.text),
            ),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Trending Tags Picker ─────────────────────────────────
          if (_results.isEmpty && !_loading) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AnonUTheme.popYellow,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AnonUTheme.black, width: 1.5),
                    ),
                    child: const Text(
                      'EXPLORE',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'TRENDING CAMPUS TOPICS',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 12.5,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: AnonUConstants.suggestedTags.map((t) {
                  return GestureDetector(
                    onTap: () {
                      _searchController.text = t;
                      _search(t);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AnonUTheme.bgSurface,
                        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                        border: Border.all(color: AnonUTheme.black, width: 1.5),
                        boxShadow: const [
                          BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                        ],
                      ),
                      child: Text(
                        '#$t',
                        style: const TextStyle(
                          color: AnonUTheme.black,
                          fontWeight: FontWeight.w800,
                          fontSize: 12.5,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],

          if (_loading)
            const Expanded(
              child: Center(
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: AnonUTheme.black,
                ),
              ),
            ),

          if (_hasSearched && _results.isEmpty && !_loading)
            Expanded(
              child: Center(
                child: BrutalistCard(
                  margin: const EdgeInsets.all(24),
                  padding: const EdgeInsets.all(20),
                  backgroundColor: AnonUTheme.bgSurface,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.search_off_rounded, size: 36, color: AnonUTheme.black),
                      const SizedBox(height: 10),
                      Text(
                        'NO MATCHES FOR "${_searchController.text}"',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Try searching by tag (e.g. #rant, #study) or broader terms.',
                        style: TextStyle(color: AnonUTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),

          if (_results.isNotEmpty)
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.only(top: 8, bottom: 20),
                itemCount: _results.length,
                itemBuilder: (_, i) {
                  final post = _results[i];
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
                        onRepost: () => _handleRepost(post),
                        onReport: () => _handleReport(post.id),
                        onPollVote: (idx) => postService.votePoll(post.id, idx),
                      );
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _search(String query) async {
    final clean = query.trim().replaceAll('#', '');
    if (clean.isEmpty) return;
    setState(() {
      _loading = true;
      _hasSearched = true;
    });
    final results = await ref.read(postServiceProvider).searchPosts(clean.toLowerCase());
    setState(() {
      _results = results;
      _loading = false;
    });
  }

  Future<void> _handleRepost(PostModel post) async {
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

  Future<void> _handleReport(String postId) async {
    await ref.read(postServiceProvider).reportPost(postId, 'Reported from search');
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
