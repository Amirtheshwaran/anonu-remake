import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/shared/models/post_model.dart';
import 'package:anonu/shared/services/pseudonym_service.dart';
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

    final card = BrutalistCard(
      margin: isDetail
          ? const EdgeInsets.all(12)
          : const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      padding: const EdgeInsets.all(16),
      backgroundColor: AnonUTheme.bgSurface,
      borderWidth: AnonUTheme.borderWidth,
      borderRadius: AnonUTheme.radiusSm,
      shadowOffset: isDetail ? AnonUTheme.shadowOffsetSm : AnonUTheme.shadowOffset,
      onTap: isDetail ? null : onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Repost Banner (if repost) ───────────────────────────
          if (post.isRepost) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AnonUTheme.popYellow,
                borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
                border: Border.all(color: AnonUTheme.black, width: 1.5),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.repeat_rounded, size: 14, color: AnonUTheme.black),
                  const SizedBox(width: 6),
                  Text(
                    'REPOSTED FROM @${post.originalAuthorPseudonym ?? "ANONYMOUS"}',
                    style: const TextStyle(
                      color: AnonUTheme.black,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ── Header: Avatar, Name/Pseudonym, Badges, Expiry ─────
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _AuthorAvatar(post: post),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            post.isAnonymous
                                ? post.pseudonym
                                : (post.displayName ?? post.pseudonym),
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 14.5,
                              color: AnonUTheme.black,
                              letterSpacing: -0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        if (post.isAnonymous)
                          const BrutalistBadge(
                            label: 'ANON',
                            backgroundColor: AnonUTheme.popMint,
                            fontSize: 9.5,
                            borderWidth: 1.5,
                            hasShadow: false,
                          )
                        else
                          const BrutalistBadge(
                            label: 'VERIFIED',
                            backgroundColor: AnonUTheme.popYellow,
                            fontSize: 9.5,
                            borderWidth: 1.5,
                            hasShadow: false,
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      timeago.format(post.createdAt).toUpperCase(),
                      style: const TextStyle(
                        color: AnonUTheme.textMuted,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              // Expiry Badge
              if (post.expiresAt != null) ...[
                _BrutalistExpiryBadge(expiresAt: post.expiresAt!),
                const SizedBox(width: 6),
              ],
              _MoreMenu(onReport: onReport),
            ],
          ),

          // ── Tags ────────────────────────────────────────────────
          if (post.tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: post.tags.map((t) => TagChip(tag: t)).toList(),
            ),
          ],

          // ── Content ─────────────────────────────────────────────
          const SizedBox(height: 10),
          Text(
            post.content,
            style: const TextStyle(
              fontSize: 15,
              height: 1.4,
              color: AnonUTheme.black,
              fontWeight: FontWeight.w600,
            ),
            maxLines: isDetail ? null : 6,
            overflow: isDetail ? TextOverflow.visible : TextOverflow.ellipsis,
          ),

          // ── Images ──────────────────────────────────────────────
          if (post.imageUrls.isNotEmpty) ...[
            const SizedBox(height: 12),
            ImageGrid(urls: post.imageUrls),
          ],

          // ── Poll ────────────────────────────────────────────────
          if (post.poll != null) ...[
            const SizedBox(height: 12),
            PollWidget(poll: post.poll!, onVote: onPollVote),
          ],

          // ── Action Bar: VoteBar, Comments, Repost ────────────────
          const SizedBox(height: 14),
          Row(
            children: [
              VoteBar(
                score: post.score,
                userVote: userVote,
                onUpvote: onUpvote,
                onDownvote: onDownvote,
              ),
              const Spacer(),
              // Comments pill button
              _ActionButtonPill(
                icon: Icons.chat_bubble_outline_rounded,
                count: post.commentCount,
                onTap: onComment,
                backgroundColor: AnonUTheme.bgCream,
              ),
              const SizedBox(width: 8),
              // Repost pill button
              _ActionButtonPill(
                icon: Icons.repeat_rounded,
                count: post.repostCount,
                onTap: onRepost,
                backgroundColor: AnonUTheme.bgCream,
                activeColor: AnonUTheme.popOrange,
              ),
            ],
          ),
        ],
      ),
    );

    return card;
  }
}

class _AuthorAvatar extends StatelessWidget {
  final PostModel post;
  const _AuthorAvatar({required this.post});

  @override
  Widget build(BuildContext context) {
    if (!post.isAnonymous && post.avatarUrl != null) {
      return Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
          border: Border.all(color: AnonUTheme.black, width: 2),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
          child: CachedNetworkImage(
            imageUrl: post.avatarUrl!,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => _fallbackAvatar(),
          ),
        ),
      );
    }

    return _fallbackAvatar();
  }

  Widget _fallbackAvatar() {
    final avatarColor = PseudonymService.colorForPseudonym(post.pseudonym);
    final initials = post.isAnonymous
        ? post.pseudonym.split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join()
        : (post.displayName != null && post.displayName!.isNotEmpty
            ? post.displayName![0]
            : 'U');

    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: avatarColor,
        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
        border: Border.all(color: AnonUTheme.black, width: 2),
        boxShadow: const [
          BoxShadow(
            color: AnonUTheme.black,
            offset: Offset(1.5, 1.5),
            blurRadius: 0,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        initials.toUpperCase(),
        style: const TextStyle(
          color: AnonUTheme.black,
          fontWeight: FontWeight.w900,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _BrutalistExpiryBadge extends StatelessWidget {
  final DateTime expiresAt;
  const _BrutalistExpiryBadge({required this.expiresAt});

  @override
  Widget build(BuildContext context) {
    final remaining = expiresAt.difference(DateTime.now());
    final label = remaining.isNegative
        ? 'EXP'
        : (remaining.inHours > 0
            ? '${remaining.inHours}H'
            : '${remaining.inMinutes}M');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: AnonUTheme.popOrange,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AnonUTheme.black, width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.hourglass_top_rounded, size: 11, color: AnonUTheme.black),
          const SizedBox(width: 3),
          Text(
            label,
            style: const TextStyle(
              color: AnonUTheme.black,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _MoreMenu extends StatelessWidget {
  final VoidCallback onReport;
  const _MoreMenu({required this.onReport});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert_rounded, color: AnonUTheme.black, size: 20),
      color: AnonUTheme.bgSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
        side: const BorderSide(color: AnonUTheme.black, width: 2),
      ),
      onSelected: (val) {
        if (val == 'report') onReport();
      },
      itemBuilder: (_) => [
        const PopupMenuItem(
          value: 'report',
          child: Row(
            children: [
              Icon(Icons.flag_rounded, size: 18, color: AnonUTheme.downvoteRed),
              SizedBox(width: 8),
              Text(
                'REPORT POST',
                style: TextStyle(
                  color: AnonUTheme.black,
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionButtonPill extends StatelessWidget {
  final IconData icon;
  final int count;
  final VoidCallback onTap;
  final Color backgroundColor;
  final Color? activeColor;

  const _ActionButtonPill({
    required this.icon,
    required this.count,
    required this.onTap,
    required this.backgroundColor,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
          border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
          boxShadow: const [
            BoxShadow(
              color: AnonUTheme.black,
              offset: Offset(2.0, 2.0),
              blurRadius: 0,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: activeColor ?? AnonUTheme.black),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Text(
                '$count',
                style: TextStyle(
                  color: activeColor ?? AnonUTheme.black,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
