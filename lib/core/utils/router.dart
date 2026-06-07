import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/features/auth/presentation/screens/auth_screen.dart';
import 'package:anonu/features/post/presentation/screens/compose_screen.dart';
import 'package:anonu/features/post/presentation/screens/post_thread_screen.dart';
import 'package:anonu/features/profile/presentation/screens/profile_screen.dart';

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
          GoRoute(
              path: '/notifications',
              builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(path: '/auth', builder: (_, __) => const AuthScreen()),
      GoRoute(path: '/compose', builder: (_, __) => const ComposeScreen()),
      GoRoute(
        path: '/post/:id',
        builder: (_, state) =>
            PostThreadScreen(postId: state.pathParameters['id']!),
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
    (path: '/', icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Feed'),
    (
      path: '/notifications',
      icon: Icons.notifications_outlined,
      activeIcon: Icons.notifications_rounded,
      label: 'Alerts'
    ),
    (path: '/profile', icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AnonUTheme.surface,
          border: Border(top: BorderSide(color: AnonUTheme.border, width: 0.5)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 56,
            child: Row(
              children: List.generate(_destinations.length, (i) {
                final dest = _destinations[i];
                final isActive = _currentIndex == i;
                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      setState(() => _currentIndex = i);
                      context.go(dest.path);
                    },
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 150),
                          child: Icon(
                            isActive ? dest.activeIcon : dest.icon,
                            key: ValueKey(isActive),
                            color: isActive
                                ? AnonUTheme.maroon
                                : AnonUTheme.textMuted,
                            size: 24,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          dest.label,
                          style: TextStyle(
                            color: isActive
                                ? AnonUTheme.maroon
                                : AnonUTheme.textMuted,
                            fontSize: 10,
                            fontWeight: isActive
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ],
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
