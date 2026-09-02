import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:anonu/core/theme/app_theme.dart';

class VoteBar extends StatelessWidget {
  final int score;
  final bool? userVote; // true=up, false=down, null=none
  final VoidCallback onUpvote;
  final VoidCallback onDownvote;

  const VoteBar({
    super.key,
    required this.score,
    required this.userVote,
    required this.onUpvote,
    required this.onDownvote,
  });

  @override
  Widget build(BuildContext context) {
    final isUp = userVote == true;
    final isDown = userVote == false;

    return Container(
      height: 36,
      decoration: BoxDecoration(
        color: AnonUTheme.bgCream,
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
          // Upvote Button
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onUpvote();
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: isUp ? AnonUTheme.popMint : Colors.transparent,
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(AnonUTheme.radiusSm - 2)),
              ),
              child: Icon(
                Icons.arrow_upward_rounded,
                size: 18,
                color: isUp ? AnonUTheme.black : AnonUTheme.textSecondary,
              ),
            ),
          ),
          // Divider
          Container(
            width: AnonUTheme.borderWidthThin,
            height: 36,
            color: AnonUTheme.black,
          ),
          // Score counter
          Container(
            constraints: const BoxConstraints(minWidth: 32.0),
            padding: const EdgeInsets.symmetric(horizontal: 8),
            alignment: Alignment.center,
            child: Text(
              score > 0 ? '+$score' : '$score',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: isUp
                    ? const Color(0xFF008744)
                    : isDown
                        ? AnonUTheme.downvoteRed
                        : AnonUTheme.black,
              ),
            ),
          ),
          // Divider
          Container(
            width: AnonUTheme.borderWidthThin,
            height: 36,
            color: AnonUTheme.black,
          ),
          // Downvote Button
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onDownvote();
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: isDown ? AnonUTheme.downvoteRed : Colors.transparent,
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(AnonUTheme.radiusSm - 2)),
              ),
              child: Icon(
                Icons.arrow_downward_rounded,
                size: 18,
                color: isDown ? Colors.white : AnonUTheme.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
