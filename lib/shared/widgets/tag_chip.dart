import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/shared/models/post_model.dart';

// ── Tag Chip ──────────────────────────────────────────────────────────────────
class TagChip extends StatelessWidget {
  final String tag;
  final VoidCallback? onTap;

  const TagChip({super.key, required this.tag, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: AnonUTheme.maroon.withOpacity(0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AnonUTheme.maroon.withOpacity(0.3), width: 0.5),
        ),
        child: Text(
          '#$tag',
          style: const TextStyle(
            color: AnonUTheme.maroonLight,
            fontSize: 11.5,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

// ── Poll Widget ───────────────────────────────────────────────────────────────
class PollWidget extends StatelessWidget {
  final PollData poll;
  final Function(int)? onVote;

  const PollWidget({super.key, required this.poll, this.onVote});

  @override
  Widget build(BuildContext context) {
    final total = poll.totalVotes;
    final expired = poll.isExpired;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...List.generate(poll.options.length, (i) {
          final votes = poll.votes[i.toString()] ?? 0;
          final pct = total > 0 ? votes / total : 0.0;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: (!expired && onVote != null) ? () => onVote!(i) : null,
              child: Stack(
                children: [
                  // Background fill
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    height: 40,
                    decoration: BoxDecoration(
                      color: AnonUTheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  // Progress fill
                  AnimatedFractionallySizedBox(
                    duration: const Duration(milliseconds: 400),
                    widthFactor: pct,
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: AnonUTheme.maroon.withOpacity(0.25),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  // Label
                  Positioned.fill(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              poll.options[i],
                              style: const TextStyle(
                                color: AnonUTheme.textPrimary,
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (total > 0)
                            Text(
                              '${(pct * 100).round()}%',
                              style: const TextStyle(
                                color: AnonUTheme.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
        Row(
          children: [
            Text(
              '$total vote${total == 1 ? '' : 's'}',
              style: const TextStyle(
                color: AnonUTheme.textMuted,
                fontSize: 11.5,
              ),
            ),
            const Spacer(),
            if (expired)
              const Text(
                'Poll ended',
                style: TextStyle(color: AnonUTheme.textMuted, fontSize: 11.5),
              )
            else
              Text(
                'Ends ${_formatExpiry(poll.endsAt)}',
                style: const TextStyle(color: AnonUTheme.textMuted, fontSize: 11.5),
              ),
          ],
        ),
      ],
    );
  }

  String _formatExpiry(DateTime dt) {
    final diff = dt.difference(DateTime.now());
    if (diff.inDays > 0) return 'in ${diff.inDays}d';
    if (diff.inHours > 0) return 'in ${diff.inHours}h';
    return 'in ${diff.inMinutes}m';
  }
}

// ── Image Grid ────────────────────────────────────────────────────────────────
class ImageGrid extends StatelessWidget {
  final List<String> urls;

  const ImageGrid({super.key, required this.urls});

  @override
  Widget build(BuildContext context) {
    if (urls.isEmpty) return const SizedBox.shrink();
    if (urls.length == 1) return _SingleImage(url: urls[0]);

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: urls.length == 2 ? 2 : 2,
      mainAxisSpacing: 4,
      crossAxisSpacing: 4,
      childAspectRatio: 1,
      children: urls
          .take(4)
          .map((url) => _GridImage(url: url, hasMore: urls.length > 4))
          .toList(),
    );
  }
}

class _SingleImage extends StatelessWidget {
  final String url;
  const _SingleImage({required this.url});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        width: double.infinity,
        height: 220,
        placeholder: (_, __) => Container(
          height: 220,
          color: AnonUTheme.surfaceVariant,
        ),
      ),
    );
  }
}

class _GridImage extends StatelessWidget {
  final String url;
  final bool hasMore;
  const _GridImage({required this.url, required this.hasMore});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(color: AnonUTheme.surfaceVariant),
      ),
    );
  }
}
