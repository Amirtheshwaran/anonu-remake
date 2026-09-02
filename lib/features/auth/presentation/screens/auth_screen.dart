import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/services/pseudonym_service.dart';

class AuthScreen extends ConsumerStatefulWidget {
  final bool isLogin;
  const AuthScreen({super.key, this.isLogin = true});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLogin = true;
  bool _loading = false;
  bool _obscure = true;
  String _previewPseudonym = PseudonymService.generateRandom();

  @override
  void initState() {
    super.initState();
    _isLogin = widget.isLogin;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _rerollPreview() {
    setState(() {
      _previewPseudonym = PseudonymService.generateRandom();
    });
  }

  @override
  Widget build(BuildContext context) {
    final previewColor = PseudonymService.colorForPseudonym(_previewPseudonym);

    return Scaffold(
      backgroundColor: AnonUTheme.bgCream,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Hero Brand Header ──────────────────────────────────────
                Center(
                  child: BrutalistCard(
                    backgroundColor: AnonUTheme.popYellow,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    child: Column(
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AnonUTheme.black,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'CAMPUS',
                                style: TextStyle(
                                  color: AnonUTheme.popYellow,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'AnonU',
                              style: TextStyle(
                                color: AnonUTheme.black,
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1.5,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'MICROBLOG // ANONYMOUS & IDENTIFIED',
                          style: TextStyle(
                            color: AnonUTheme.black,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // ── Auth Form Card ─────────────────────────────────────────
                BrutalistCard(
                  backgroundColor: AnonUTheme.bgSurface,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Mode Selector (Sign In / Sign Up)
                      Container(
                        decoration: BoxDecoration(
                          color: AnonUTheme.bgCream,
                          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                          border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                        ),
                        padding: const EdgeInsets.all(4),
                        child: Row(
                          children: [
                            Expanded(
                              child: _AuthTab(
                                label: 'SIGN IN',
                                selected: _isLogin,
                                onTap: () => setState(() => _isLogin = true),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: _AuthTab(
                                label: 'SIGN UP',
                                selected: !_isLogin,
                                onTap: () => setState(() => _isLogin = false),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Email Field
                      const Text(
                        'UNIVERSITY EMAIL',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 11.5,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      BrutalistTextField(
                        controller: _emailController,
                        hintText: 'student@university.edu',
                        keyboardType: TextInputType.emailAddress,
                        prefixIcon: const Icon(Icons.alternate_email_rounded, color: AnonUTheme.black, size: 20),
                      ),
                      const SizedBox(height: 16),

                      // Password Field
                      const Text(
                        'PASSWORD',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 11.5,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      BrutalistTextField(
                        controller: _passwordController,
                        hintText: '••••••••••••',
                        obscureText: _obscure,
                        prefixIcon: const Icon(Icons.lock_outline_rounded, color: AnonUTheme.black, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: AnonUTheme.black,
                            size: 20,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),

                      // Pseudonym preview banner during signup
                      if (!_isLogin) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: previewColor.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                            border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.masks_rounded, size: 18, color: AnonUTheme.black),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'YOUR PSEUDONYM MASK',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 11,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const Spacer(),
                                  GestureDetector(
                                    onTap: _rerollPreview,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AnonUTheme.black,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        '🎲 REROLL',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '"$_previewPseudonym"',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  color: AnonUTheme.black,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'A unique pseudonym will protect your identity on every post.',
                                style: TextStyle(
                                  color: AnonUTheme.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 22),

                      // Submit Primary Action Button
                      BrutalistButton(
                        text: _isLogin ? 'SIGN IN →' : 'CREATE ACCOUNT →',
                        backgroundColor: AnonUTheme.popYellow,
                        isFullWidth: true,
                        isLoading: _loading,
                        onPressed: _submit,
                      ),
                      const SizedBox(height: 12),

                      // Anonymous Guest Button
                      BrutalistButton(
                        text: 'CONTINUE ANONYMOUSLY',
                        icon: const Icon(Icons.person_pin_circle_outlined, size: 18, color: AnonUTheme.black),
                        backgroundColor: AnonUTheme.popMint,
                        isFullWidth: true,
                        isLoading: _loading,
                        onPressed: _signInAnonymously,
                      ),

                      if (_isLogin) ...[
                        const SizedBox(height: 12),
                        Center(
                          child: TextButton(
                            onPressed: _resetPassword,
                            child: const Text(
                              'FORGOT PASSWORD?',
                              style: TextStyle(
                                color: AnonUTheme.black,
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 20),
                const Center(
                  child: Text(
                    'SAFE • UNFILTERED • ENCRYPTED CAMPUS VOICES',
                    style: TextStyle(
                      color: AnonUTheme.textMuted,
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      _showError('Please enter both email and password.');
      return;
    }

    setState(() => _loading = true);

    try {
      final auth = ref.read(authServiceProvider);
      if (_isLogin) {
        await auth.signIn(email: email, password: password);
      } else {
        await auth.signUp(email: email, password: password);
      }
      if (mounted) context.go('/');
    } catch (e) {
      setState(() => _loading = false);
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> _signInAnonymously() async {
    setState(() => _loading = true);
    try {
      await ref.read(authServiceProvider).signInAnonymously();
      if (mounted) context.go('/');
    } catch (e) {
      setState(() => _loading = false);
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> _resetPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showError('Enter your university email first to receive reset link.');
      return;
    }
    try {
      await ref.read(authServiceProvider).resetPassword(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AnonUTheme.popMint,
            content: Text(
              'Reset password email dispatched!',
              style: TextStyle(color: AnonUTheme.black, fontWeight: FontWeight.w800),
            ),
          ),
        );
      }
    } catch (e) {
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AnonUTheme.downvoteRed,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
          side: const BorderSide(color: AnonUTheme.black, width: 2),
        ),
        content: Text(
          message,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _AuthTab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _AuthTab({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AnonUTheme.popYellow : Colors.transparent,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
          border: selected ? Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin) : null,
          boxShadow: selected
              ? const [
                  BoxShadow(
                    color: AnonUTheme.black,
                    offset: Offset(2, 2),
                    blurRadius: 0,
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AnonUTheme.black,
            fontWeight: selected ? FontWeight.w900 : FontWeight.w700,
            fontSize: 13,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
