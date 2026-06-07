import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'vote_bar.dart';
import 'tag_chip.dart';

class PostCard extends StatelessWidget {
  final PostModel post;
  final bool? userVote; // true=up, false=down, null=none
  final VoidCallback? onTap;
  final VoidCallback onUpvote;
  final VoidCallback onDownvote;
  final VoidCallback onComment;
  final VoidCallback onRepost;
  final VoidCallback onReport;
  final Function(int)? onPollVote;
  final bool isDetail; // expanded view in thread screen

  const PostCard({
    super.key,
    required this.post,
    this.userVote,
    this.onTap,
    required this.onUpvote,
    required this.onDownvote,
    required this.onComment,
    required this.onRepost,
    required this.onReport,
    this.onPollVote,
    this.isDetail = false,
  });

  @override
  Widget build(BuildContext context) {
    if (post.isExpired) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: AnonUTheme.surface,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Row(
                children: [
                  _AuthorAvatar(post: post),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              post.isAnonymous
                                  ? post.pseudonym
                                  : (post.displayName ?? post.pseudonym),
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13.5,
                                color: AnonUTheme.textPrimary,
                              ),
                            ),
                            if (post.isAnonymous) ...[
                              const SizedBox(width: 6),
                              _AnonBadge(),
                            ],
                            if (post.isRepost) ...[
                              const SizedBox(width: 6),
                              _RepostBadge(original: post.originalAuthorPseudonym ?? ''),
                            ],
                          ],
                        ),
                        Text(
                          timeago.format(post.createdAt),
                          style: const TextStyle(
                            color: AnonUTheme.textMuted,
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Expiry badge
                  if (post.expiresAt != null) _ExpiryBadge(expiresAt: post.expiresAt!),
                  const SizedBox(width: 8),
                  _MoreMenu(post: post, onReport: onReport),
                ],
              ),
            ),

            // ── Tags ─────────────────────────────────────────────
            if (post.tags.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Wrap(
                  spacing: 6,
                  children: post.tags.map((t) => TagChip(tag: t)).toList(),
                ),
              ),

            // ── Content ──────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Text(
                post.content,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.45,
                  color: AnonUTheme.textPrimary,
                ),
                maxLines: isDetail ? null : 6,
                overflow: isDetail ? TextOverflow.visible : TextOverflow.ellipsis,
              ),
            ),

            // ── Images ───────────────────────────────────────────
            if (post.imageUrls.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: ImageGrid(urls: post.imageUrls),
              ),

            // ── Poll ─────────────────────────────────────────────
            if (post.poll != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: PollWidget(
                  poll: post.poll!,
                  onVote: onPollVote,
                ),
              ),

            // ── Action bar ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
              child: Row(
                children: [
                  VoteBar(
                    score: post.score,
                    userVote: userVote,
                    onUpvote: onUpvote,
                    onDownvote: onDownvote,
                  ),
                  const Spacer(),
                  _ActionButton(
                    icon: Icons.chat_bubble_outline_rounded,
                    label: post.commentCount > 0
                        ? post.commentCount.toString()
                        : '',
                    onTap: onComment,
                  ),
                  const SizedBox(width: 4),
                  _ActionButton(
                    icon: Icons.repeat_rounded,
                    label: post.repostCount > 0
                        ? post.repostCount.toString()
                        : '',
                    onTap: onRepost,
                    activeColor: AnonUTheme.anonGreen,
                  ),
                ],
              ),
            ),

            const Divider(height: 1),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 200.ms);
  }
}

class _AuthorAvatar extends StatelessWidget {
  final PostModel post;
  const _AuthorAvatar({required this.post});

  @override
  Widget build(BuildContext context) {
    if (!post.isAnonymous && post.avatarUrl != null) {
      return CircleAvatar(
        radius: 18,
        backgroundImage: CachedNetworkImageProvider(post.avatarUrl!),
      );
    }

    // Anonymous avatar — color from pseudonym hash
    final color = _colorFromString(post.pseudonym);
    final initials = post.pseudonym.split(' ').map((w) => w[0]).take(2).join();

    return CircleAvatar(
      radius: 18,
      backgroundColor: color.withOpacity(0.2),
      child: Text(
        initials,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }

  Color _colorFromString(String s) {
    final colors = [
      const Color(0xFF2ECC71),
      const Color(0xFF3498DB),
      const Color(0xFF9B59B6),
      const Color(0xFFE67E22),
      const Color(0xFF1ABC9C),
      const Color(0xFFE74C3C),
      const Color(0xFF34495E),
    ];
    return colors[s.hashCode.abs() % colors.length];
  }
}

class _AnonBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AnonUTheme.anonGreen.withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Text(
        'anon',
        style: TextStyle(
          color: AnonUTheme.anonGreen,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _RepostBadge extends StatelessWidget {
  final String original;
  const _RepostBadge({required this.original});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.repeat_rounded, size: 12, color: AnonUTheme.anonGreen),
        const SizedBox(width: 2),
        Text(
          original,
          style: const TextStyle(
            color: AnonUTheme.textMuted,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

class _ExpiryBadge extends StatelessWidget {
  final DateTime expiresAt;
  const _ExpiryBadge({required this.expiresAt});

  @override
  Widget build(BuildContext context) {
    final remaining = expiresAt.difference(DateTime.now());
    final label = remaining.inHours > 0
        ? '${remaining.inHours}h'
        : '${remaining.inMinutes}m';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AnonUTheme.maroon.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, size: 10, color: AnonUTheme.maroon),
          const SizedBox(width: 3),
          Text(
            label,
            style: const TextStyle(
              color: AnonUTheme.maroon,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _MoreMenu extends StatelessWidget {
  final PostModel post;
  final VoidCallback onReport;
  const _MoreMenu({required this.post, required this.onReport});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_horiz, color: AnonUTheme.textMuted, size: 20),
      color: AnonUTheme.surfaceVariant,
      onSelected: (val) {
        if (val == 'report') onReport();
      },
      itemBuilder: (_) => [
        const PopupMenuItem(
          value: 'report',
          child: Row(
            children: [
              Icon(Icons.flag_outlined, size: 16, color: AnonUTheme.textSecondary),
              SizedBox(width: 8),
              Text('Report', style: TextStyle(color: AnonUTheme.textPrimary)),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? activeColor;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 18, color: activeColor ?? AnonUTheme.textSecondary),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: activeColor ?? AnonUTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
