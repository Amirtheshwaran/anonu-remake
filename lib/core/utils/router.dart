import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/features/auth/presentation/screens/auth_screen.dart';
import 'package:anonu/features/post/presentation/screens/compose_screen.dart';
import 'package:anonu/features/post/presentation/screens/post_thread_screen.dart';
import 'package:anonu/features/profile/presentation/screens/profile_screen.dart';
import 'package:anonu/features/search/presentation/screens/search_screen.dart';
import 'package:anonu/features/notifications/presentation/screens/notifications_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = FirebaseAuth.instance.currentUser != null;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isLoggedIn && !isAuthRoute) return '/auth';
      if (isLoggedIn && isAuthRoute) return '/';
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) => _AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const FeedScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(path: '/auth', builder: (_, __) => const AuthScreen()),
      GoRoute(path: '/compose', builder: (_, __) => const ComposeScreen()),
      GoRoute(
        path: '/post/:id',
        builder: (_, state) => PostThreadScreen(postId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
    ],
  );
});

class _AppShell extends ConsumerStatefulWidget {
  final Widget child;
  const _AppShell({required this.child});

  @override
  ConsumerState<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<_AppShell> {
  int _currentIndex = 0;

  final _destinations = [
    (path: '/', icon: Icons.feed_outlined, activeIcon: Icons.feed_rounded, label: 'FEED'),
    (path: '/notifications', icon: Icons.notifications_none_rounded, activeIcon: Icons.notifications_rounded, label: 'ALERTS'),
    (path: '/profile', icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'PROFILE'),
  ];

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    final unreadStream = uid != null
        ? FirebaseFirestore.instance
            .collection('notifications')
            .where('recipientUid', isEqualTo: uid)
            .where('isRead', isEqualTo: false)
            .snapshots()
            .map((snap) => snap.docs.length)
        : Stream.value(0);

    return Scaffold(
      backgroundColor: AnonUTheme.bgCream,
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AnonUTheme.bgSurface,
          border: Border(top: BorderSide(color: AnonUTheme.black, width: 2.5)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 62,
            child: Row(
              children: List.generate(_destinations.length, (i) {
                final dest = _destinations[i];
                final isActive = _currentIndex == i;
                final isAlerts = dest.path == '/notifications';

                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      setState(() => _currentIndex = i);
                      context.go(dest.path);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Center(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                          decoration: BoxDecoration(
                            color: isActive ? AnonUTheme.popYellow : Colors.transparent,
                            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                            border: isActive
                                ? Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin)
                                : null,
                            boxShadow: isActive
                                ? const [
                                    BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                                  ]
                                : null,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Icon(
                                    isActive ? dest.activeIcon : dest.icon,
                                    color: AnonUTheme.black,
                                    size: 20,
                                  ),
                                  if (isAlerts)
                                    StreamBuilder<int>(
                                      stream: unreadStream,
                                      builder: (_, snap) {
                                        final count = snap.data ?? 0;
                                        if (count == 0) return const SizedBox.shrink();
                                        return Positioned(
                                          top: -3,
                                          right: -3,
                                          child: Container(
                                            width: 8,
                                            height: 8,
                                            decoration: BoxDecoration(
                                              color: AnonUTheme.downvoteRed,
                                              shape: BoxShape.circle,
                                              border: Border.all(color: AnonUTheme.black, width: 1.5),
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                ],
                              ),
                              const SizedBox(width: 6),
                              Text(
                                dest.label,
                                style: TextStyle(
                                  color: AnonUTheme.black,
                                  fontSize: 11.5,
                                  fontWeight: isActive ? FontWeight.w900 : FontWeight.w700,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
