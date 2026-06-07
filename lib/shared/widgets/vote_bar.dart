// vote_bar.dart
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:anonu/core/theme/app_theme.dart';

class VoteBar extends StatelessWidget {
  final int score;
  final bool? userVote;
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

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _VoteButton(
          icon: Icons.arrow_upward_rounded,
          active: isUp,
          activeColor: AnonUTheme.upvote,
          onTap: onUpvote,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: Text(
            score > 0 ? '+$score' : '$score',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isUp
                  ? AnonUTheme.upvote
                  : isDown
                      ? AnonUTheme.downvote
                      : AnonUTheme.textSecondary,
            ),
          ),
        ),
        _VoteButton(
          icon: Icons.arrow_downward_rounded,
          active: isDown,
          activeColor: AnonUTheme.downvote,
          onTap: onDownvote,
        ),
      ],
    );
  }
}

class _VoteButton extends StatelessWidget {
  final IconData icon;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _VoteButton({
    required this.icon,
    required this.active,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: active ? activeColor.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(
          icon,
          size: 18,
          color: active ? activeColor : AnonUTheme.textMuted,
        ),
      ),
    ).animate(target: active ? 1 : 0).scale(
          begin: const Offset(1, 1),
          end: const Offset(1.15, 1.15),
          duration: 120.ms,
          curve: Curves.easeOut,
        );
  }
}
