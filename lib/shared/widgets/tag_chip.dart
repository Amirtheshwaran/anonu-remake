import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/shared/models/post_model.dart';

// ── Neo-Brutalist Tag Chip ──────────────────────────────────────────────────
class TagChip extends StatelessWidget {
  final String tag;
  final VoidCallback? onTap;
  final Color backgroundColor;

  const TagChip({
    super.key,
    required this.tag,
    this.onTap,
    this.backgroundColor = AnonUTheme.popCyan,
  });

  @override
  Widget build(BuildContext context) {
    return BrutalistBadge(
      label: '#$tag',
      backgroundColor: backgroundColor,
      textColor: AnonUTheme.black,
      borderColor: AnonUTheme.black,
      borderWidth: 2.0,
      fontSize: 11,
      hasShadow: true,
      onTap: onTap,
    );
  }
}

// ── Neo-Brutalist Poll Widget ───────────────────────────────────────────────
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
          final pctString = '${(pct * 100).round()}%';

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: (!expired && onVote != null) ? () => onVote!(i) : null,
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: AnonUTheme.bgCream,
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
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
                  child: Stack(
                    children: [
                      // Animated Brutalist Meter Fill
                      AnimatedFractionallySizedBox(
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeOutCubic,
                        widthFactor: pct.clamp(0.0, 1.0),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AnonUTheme.popMint,
                            border: pct > 0
                                ? const Border(
                                    right: BorderSide(
                                      color: AnonUTheme.black,
                                      width: AnonUTheme.borderWidthThin,
                                    ),
                                  )
                                : null,
                          ),
                        ),
                      ),
                      // Text Label & Percentage
                      Positioned.fill(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  color: AnonUTheme.black,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  String.fromCharCode(65 + i), // A, B, C, D
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  poll.options[i],
                                  style: const TextStyle(
                                    color: AnonUTheme.black,
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w800,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (total > 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AnonUTheme.black,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    pctString,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AnonUTheme.bgCream,
                  border: Border.all(color: AnonUTheme.black, width: 1.5),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '$total VOTE${total == 1 ? '' : 'S'}',
                  style: const TextStyle(
                    color: AnonUTheme.black,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                expired ? 'POLL CLOSED' : 'ENDS ${_formatExpiry(poll.endsAt)}',
                style: TextStyle(
                  color: expired ? AnonUTheme.downvoteRed : AnonUTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatExpiry(DateTime dt) {
    final diff = dt.difference(DateTime.now());
    if (diff.isNegative) return 'JUST NOW';
    if (diff.inDays > 0) return 'IN ${diff.inDays}D';
    if (diff.inHours > 0) return 'IN ${diff.inHours}H';
    return 'IN ${diff.inMinutes}M';
  }
}

// ── Neo-Brutalist Image Grid ────────────────────────────────────────────────
class ImageGrid extends StatelessWidget {
  final List<String> urls;

  const ImageGrid({super.key, required this.urls});

  @override
  Widget build(BuildContext context) {
    if (urls.isEmpty) return const SizedBox.shrink();

    if (urls.length == 1) {
      return _BrutalistImageFrame(
        url: urls[0],
        height: 220,
        onTap: () => _openFullscreen(context, urls, 0),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: urls.take(4).length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.25,
      ),
      itemBuilder: (context, i) {
        return _BrutalistImageFrame(
          url: urls[i],
          onTap: () => _openFullscreen(context, urls, i),
        );
      },
    );
  }

  void _openFullscreen(BuildContext context, List<String> images, int initialIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _FullscreenImageViewer(images: images, initialIndex: initialIndex),
      ),
    );
  }
}

class _BrutalistImageFrame extends StatelessWidget {
  final String url;
  final double? height;
  final VoidCallback? onTap;

  const _BrutalistImageFrame({required this.url, this.height, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: AnonUTheme.bgCream,
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
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
          child: CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.cover,
            width: double.infinity,
            height: height ?? double.infinity,
            placeholder: (_, __) => Container(
              color: const Color(0xFFE5E2D9),
              child: const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AnonUTheme.black,
                ),
              ),
            ),
            errorWidget: (_, __, ___) => Container(
              color: const Color(0xFFE5E2D9),
              child: const Icon(Icons.broken_image_rounded, color: AnonUTheme.black),
            ),
          ),
        ),
      ),
    );
  }
}

class _FullscreenImageViewer extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const _FullscreenImageViewer({required this.images, required this.initialIndex});

  @override
  State<_FullscreenImageViewer> createState() => _FullscreenImageViewerState();
}

class _FullscreenImageViewerState extends State<_FullscreenImageViewer> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AnonUTheme.black,
      appBar: AppBar(
        backgroundColor: AnonUTheme.black,
        foregroundColor: Colors.white,
        title: Text(
          'IMAGE ${_currentIndex + 1}/${widget.images.length}',
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
        ),
      ),
      body: PageView.builder(
        itemCount: widget.images.length,
        controller: PageController(initialPage: widget.initialIndex),
        onPageChanged: (i) => setState(() => _currentIndex = i),
        itemBuilder: (context, i) {
          return Center(
            child: InteractiveViewer(
              child: CachedNetworkImage(
                imageUrl: widget.images[i],
                fit: BoxFit.contain,
              ),
            ),
          );
        },
      ),
    );
  }
}
