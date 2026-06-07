import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/constants/constants.dart';
import 'package:anonu/shared/models/user_model.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';

class MoodBar extends ConsumerWidget {
  const MoodBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final moodBoard = ref.watch(_moodBoardProvider);
    final currentUser = ref.watch(currentUserProvider).value;

    return Container(
      height: 52,
      color: AnonUTheme.surface,
      child: Row(
        children: [
          // Campus mood board display
          Expanded(
            child: moodBoard.when(
              data: (counts) => _MoodBoardDisplay(counts: counts),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
          // Check-in button
          GestureDetector(
            onTap: () => _showMoodCheckIn(context, ref, currentUser),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AnonUTheme.maroon.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: AnonUTheme.maroon.withOpacity(0.4), width: 0.5),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    currentUser?.lastMood ?? '😐',
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'Check in',
                    style: TextStyle(
                      color: AnonUTheme.maroon,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if ((currentUser?.currentStreak ?? 0) > 0) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AnonUTheme.maroon,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${currentUser!.currentStreak}🔥',
                        style: const TextStyle(fontSize: 9, color: Colors.white),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const Divider(height: 1),
        ],
      ),
    );
  }

  void _showMoodCheckIn(
      BuildContext context, WidgetRef ref, UserModel? user) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AnonUTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _MoodCheckInSheet(
        onSelect: (mood) async {
          final uid = ref.read(authServiceProvider).currentUser?.uid;
          if (uid != null) {
            await ref.read(authServiceProvider).checkInMood(uid, mood);
            ref.invalidate(currentUserProvider);
          }
          if (context.mounted) Navigator.pop(context);
        },
      ),
    );
  }
}

class _MoodBoardDisplay extends StatelessWidget {
  final Map<String, int> counts;
  const _MoodBoardDisplay({required this.counts});

  @override
  Widget build(BuildContext context) {
    if (counts.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(left: 16),
        child: Text(
          'Campus mood — check in!',
          style: TextStyle(color: AnonUTheme.textMuted, fontSize: 12),
        ),
      );
    }

    // Sort by count
    final sorted = counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return ListView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      children: sorted.take(6).map((entry) {
        final mood = AnonUConstants.moods
            .firstWhere((m) => m['label'] == entry.key,
                orElse: () => {'emoji': '😐', 'label': entry.key});
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Row(
            children: [
              Text(mood['emoji']!, style: const TextStyle(fontSize: 15)),
              const SizedBox(width: 3),
              Text(
                '${entry.value}',
                style: const TextStyle(
                    color: AnonUTheme.textMuted, fontSize: 11.5),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _MoodCheckInSheet extends StatelessWidget {
  final Function(String) onSelect;
  const _MoodCheckInSheet({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'How are you feeling?',
            style: TextStyle(
              color: AnonUTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Anonymous — only your emoji joins the campus mood.',
            style: TextStyle(color: AnonUTheme.textMuted, fontSize: 12.5),
          ),
          const SizedBox(height: 24),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.8,
            children: AnonUConstants.moods.map((mood) {
              return GestureDetector(
                onTap: () => onSelect(mood['label']!),
                child: Container(
                  decoration: BoxDecoration(
                    color: AnonUTheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AnonUTheme.border),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(mood['emoji']!,
                          style: const TextStyle(fontSize: 22)),
                      const SizedBox(height: 2),
                      Text(
                        mood['label']!,
                        style: const TextStyle(
                          color: AnonUTheme.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

final _moodBoardProvider = StreamProvider<Map<String, int>>(
  (ref) => ref.read(authServiceProvider).moodBoardStream(),
);
