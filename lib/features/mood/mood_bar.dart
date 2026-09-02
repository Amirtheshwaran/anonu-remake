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
      height: 56,
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: AnonUTheme.bgSurface,
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
      child: Row(
        children: [
          // ── Campus Live Mood Ticker ──────────────────────────────
          Expanded(
            child: moodBoard.when(
              data: (counts) => _MoodBoardDisplay(counts: counts),
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  'LOADING CAMPUS VIBES...',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
                ),
              ),
              error: (_, __) => const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('MOOD BOARD OFFLINE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
              ),
            ),
          ),

          // ── Divider ──────────────────────────────────────────────
          Container(width: AnonUTheme.borderWidthThin, height: 56, color: AnonUTheme.black),

          // ── Check-in Button with Streak Pill ─────────────────────
          GestureDetector(
            onTap: () => _showMoodCheckIn(context, ref, currentUser),
            child: Container(
              color: AnonUTheme.popYellow,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              alignment: Alignment.center,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    currentUser?.lastMood ?? '😐',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'CHECK IN',
                    style: TextStyle(
                      color: AnonUTheme.black,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  if ((currentUser?.currentStreak ?? 0) > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AnonUTheme.black,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${currentUser!.currentStreak}🔥',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: AnonUTheme.popYellow,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showMoodCheckIn(BuildContext context, WidgetRef ref, UserModel? user) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _MoodCheckInSheet(
        onSelect: (mood) async {
          final uid = ref.read(authServiceProvider).currentUser?.uid;
          if (uid != null) {
            await ref.read(authServiceProvider).checkInMood(uid, mood);
            ref.invalidate(currentUserProvider);
            ref.invalidate(_moodBoardProvider);
          }
          if (context.mounted) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: AnonUTheme.popMint,
                content: Text(
                  'Campus mood updated with $mood! Streak safe.',
                  style: const TextStyle(color: AnonUTheme.black, fontWeight: FontWeight.w800),
                ),
              ),
            );
          }
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
        padding: EdgeInsets.only(left: 12),
        child: Row(
          children: [
            Text('⚡', style: TextStyle(fontSize: 14)),
            SizedBox(width: 6),
            Text(
              'CAMPUS MOOD BOARD: CHECK IN!',
              style: TextStyle(
                color: AnonUTheme.black,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      );
    }

    final sorted = counts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return ListView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      children: sorted.take(6).map((entry) {
        final mood = AnonUConstants.moods.firstWhere(
          (m) => m['label'] == entry.key,
          orElse: () => {'emoji': '😐', 'label': entry.key},
        );

        return Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AnonUTheme.bgCream,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: AnonUTheme.black, width: 1.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(mood['emoji']!, style: const TextStyle(fontSize: 15)),
              const SizedBox(width: 4),
              Text(
                '${entry.value}',
                style: const TextStyle(
                  color: AnonUTheme.black,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
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
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
      decoration: const BoxDecoration(
        color: AnonUTheme.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AnonUTheme.radiusMd)),
        border: Border(
          top: BorderSide(color: AnonUTheme.black, width: 3),
          left: BorderSide(color: AnonUTheme.black, width: 3),
          right: BorderSide(color: AnonUTheme.black, width: 3),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AnonUTheme.popYellow,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AnonUTheme.black, width: 2),
                ),
                child: const Text('🔥', style: TextStyle(fontSize: 18)),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'HOW ARE YOU FEELING TODAY?',
                      style: TextStyle(
                        color: AnonUTheme.black,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.3,
                      ),
                    ),
                    Text(
                      '100% Anonymous. Only your emoji joins the campus pulse.',
                      style: TextStyle(color: AnonUTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.6,
            children: AnonUConstants.moods.map((mood) {
              return GestureDetector(
                onTap: () => onSelect(mood['label']!),
                child: Container(
                  decoration: BoxDecoration(
                    color: AnonUTheme.bgCream,
                    borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                    border: Border.all(color: AnonUTheme.black, width: 2),
                    boxShadow: const [
                      BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(mood['emoji']!, style: const TextStyle(fontSize: 22)),
                      const SizedBox(height: 2),
                      Text(
                        mood['label']!.toUpperCase(),
                        style: const TextStyle(
                          color: AnonUTheme.black,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.4,
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
