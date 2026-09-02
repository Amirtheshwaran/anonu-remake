import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/user_model.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uid = ref.read(authServiceProvider).currentUser?.uid;

    final notifStream = ref.watch(
      StreamProvider<List<NotificationModel>>((ref) {
        if (uid == null) return Stream.value([]);
        return FirebaseFirestore.instance
            .collection('notifications')
            .where('recipientUid', isEqualTo: uid)
            .orderBy('createdAt', descending: true)
            .limit(50)
            .snapshots()
            .map((s) => s.docs.map((d) => NotificationModel.fromFirestore(d)).toList());
      }),
    );

    return Scaffold(
      backgroundColor: AnonUTheme.bgCream,
      appBar: AppBar(
        backgroundColor: AnonUTheme.bgCream,
        title: const Text('CAMPUS ALERTS'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: BrutalistButton(
              text: 'MARK READ',
              backgroundColor: AnonUTheme.popYellow,
              shadowOffset: const Offset(2, 2),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              onPressed: () => _markAllRead(uid),
            ),
          ),
        ],
      ),
      body: notifStream.when(
        data: (notifs) {
          if (notifs.isEmpty) {
            return Center(
              child: BrutalistCard(
                margin: const EdgeInsets.all(28),
                padding: const EdgeInsets.all(24),
                backgroundColor: AnonUTheme.bgSurface,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AnonUTheme.popYellow,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AnonUTheme.black, width: 2),
                      ),
                      child: const Icon(Icons.notifications_off_outlined, size: 36, color: AnonUTheme.black),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'ALL QUIET ON CAMPUS',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'No new notifications. When someone upvotes, replies, or reposts your publications, alerts show up here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AnonUTheme.textSecondary,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: notifs.length,
            itemBuilder: (_, i) {
              final notif = notifs[i];
              return _BrutalistNotifCard(
                notif: notif,
                onTap: () {
                  if (notif.postId != null) {
                    context.push('/post/${notif.postId}');
                  }
                  // Mark single as read
                  FirebaseFirestore.instance
                      .collection('notifications')
                      .doc(notif.id)
                      .update({'isRead': true});
                },
              );
            },
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(strokeWidth: 3, color: AnonUTheme.black),
        ),
        error: (e, _) => Center(
          child: BrutalistCard(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(16),
            backgroundColor: AnonUTheme.bgSurface,
            child: Text(
              'ALERT FEED ERROR: $e',
              style: const TextStyle(color: AnonUTheme.downvoteRed, fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _markAllRead(String? uid) async {
    if (uid == null) return;
    final unread = await FirebaseFirestore.instance
        .collection('notifications')
        .where('recipientUid', isEqualTo: uid)
        .where('isRead', isEqualTo: false)
        .get();

    final batch = FirebaseFirestore.instance.batch();
    for (final doc in unread.docs) {
      batch.update(doc.reference, {'isRead': true});
    }
    await batch.commit();
  }
}

class _BrutalistNotifCard extends StatelessWidget {
  final NotificationModel notif;
  final VoidCallback onTap;

  const _BrutalistNotifCard({required this.notif, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final typeInfo = _getTypeInfo(notif.type);

    return BrutalistCard(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      padding: const EdgeInsets.all(12),
      backgroundColor: notif.isRead ? AnonUTheme.bgSurface : const Color(0xFFFFFBEA),
      borderWidth: AnonUTheme.borderWidthThin,
      shadowOffset: const Offset(2.0, 2.0),
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Type sticker badge
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: typeInfo.color,
              borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
              border: Border.all(color: AnonUTheme.black, width: 2),
            ),
            alignment: Alignment.center,
            child: Icon(typeInfo.icon, size: 18, color: AnonUTheme.black),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notif.message,
                        style: TextStyle(
                          color: AnonUTheme.black,
                          fontSize: 13.5,
                          fontWeight: notif.isRead ? FontWeight.w700 : FontWeight.w900,
                        ),
                      ),
                    ),
                    if (!notif.isRead) ...[
                      const SizedBox(width: 6),
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: AnonUTheme.popYellow,
                          shape: BoxShape.circle,
                          border: Border.all(color: AnonUTheme.black, width: 1.5),
                        ),
                      ),
                    ],
                  ],
                ),
                if (notif.postPreview != null) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AnonUTheme.bgCream,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AnonUTheme.black, width: 1),
                    ),
                    child: Text(
                      notif.postPreview!,
                      style: const TextStyle(
                        color: AnonUTheme.textSecondary,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  timeago.format(notif.createdAt).toUpperCase(),
                  style: const TextStyle(
                    color: AnonUTheme.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  ({IconData icon, Color color}) _getTypeInfo(NotificationType type) {
    switch (type) {
      case NotificationType.upvote:
        return (icon: Icons.arrow_upward_rounded, color: AnonUTheme.popMint);
      case NotificationType.comment:
        return (icon: Icons.chat_bubble_rounded, color: AnonUTheme.popYellow);
      case NotificationType.reply:
        return (icon: Icons.reply_rounded, color: AnonUTheme.popCyan);
      case NotificationType.repost:
        return (icon: Icons.repeat_rounded, color: AnonUTheme.popOrange);
      case NotificationType.mention:
        return (icon: Icons.alternate_email_rounded, color: AnonUTheme.popPurple);
    }
  }
}
