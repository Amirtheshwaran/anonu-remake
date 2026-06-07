import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AnonUTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),

              // Logo
              const Text(
                'AnonU',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AnonUTheme.maroon,
                  fontSize: 42,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -2,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Your campus. Your voice. Your choice.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AnonUTheme.textMuted,
                  fontSize: 13.5,
                ),
              ),

              const Spacer(),

              // Toggle
              Container(
                decoration: BoxDecoration(
                  color: AnonUTheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    _Tab(
                      label: 'Sign in',
                      selected: _isLogin,
                      onTap: () => setState(() => _isLogin = true),
                    ),
                    _Tab(
                      label: 'Sign up',
                      selected: !_isLogin,
                      onTap: () => setState(() => _isLogin = false),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Email
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: AnonUTheme.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'University email',
                  prefixIcon: Icon(Icons.mail_outline_rounded,
                      color: AnonUTheme.textMuted, size: 18),
                ),
              ),

              const SizedBox(height: 12),

              // Password
              TextField(
                controller: _passwordController,
                obscureText: _obscure,
                style: const TextStyle(color: AnonUTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline_rounded,
                      color: AnonUTheme.textMuted, size: 18),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: AnonUTheme.textMuted,
                      size: 18,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
              ),

              if (!_isLogin) ...[
                const SizedBox(height: 10),
                const Text(
                  'You\'ll get an anonymous pseudonym like "Cyan Kestrel" — no one can link it to your email.',
                  style: TextStyle(color: AnonUTheme.textMuted, fontSize: 11.5),
                  textAlign: TextAlign.center,
                ),
              ],

              const SizedBox(height: 20),

              // Submit
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(_isLogin ? 'Sign in' : 'Create account'),
              ),

              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _loading ? null : _signInAnonymously,
                icon: const Icon(Icons.person_outline_rounded, size: 18),
                label: const Text('Continue anonymously'),
              ),

              if (_isLogin) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _resetPassword,
                  child: const Text('Forgot password?',
                      style: TextStyle(color: AnonUTheme.textMuted)),
                ),
              ],

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) return;

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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AnonUTheme.downvote,
          ),
        );
      }
    }
  }

  Future<void> _signInAnonymously() async {
    setState(() => _loading = true);
    try {
      await ref.read(authServiceProvider).signInAnonymously();
      if (mounted) context.go('/');
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AnonUTheme.downvote,
          ),
        );
      }
    }
  }

  Future<void> _resetPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter your email first.')),
      );
      return;
    }
    await ref.read(authServiceProvider).resetPassword(email);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reset email sent.')),
      );
    }
  }
}

class _Tab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Tab({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AnonUTheme.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? AnonUTheme.textPrimary : AnonUTheme.textMuted,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
