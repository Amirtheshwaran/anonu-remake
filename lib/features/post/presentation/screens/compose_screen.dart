import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/constants/constants.dart';
import 'package:anonu/core/widgets/brutalist_widgets.dart';
import 'package:anonu/features/feed/presentation/screens/feed_screen.dart';
import 'package:anonu/shared/models/post_model.dart';

class ComposeScreen extends ConsumerStatefulWidget {
  const ComposeScreen({super.key});

  @override
  ConsumerState<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends ConsumerState<ComposeScreen> {
  final _contentController = TextEditingController();
  PostIdentity _identity = PostIdentity.anonymous;
  PostType _type = PostType.text;
  final List<String> _selectedTags = [];
  int? _timeLimitHours;
  bool _loading = false;
  final _picker = ImagePicker();
  final List<XFile> _images = [];

  // Poll
  final List<TextEditingController> _pollControllers = [
    TextEditingController(),
    TextEditingController(),
  ];
  DateTime _pollEndsAt = DateTime.now().add(const Duration(hours: 24));

  int get _charCount => _contentController.text.length;
  bool get _canPost =>
      _contentController.text.trim().isNotEmpty &&
      _charCount <= AnonUConstants.maxPostLength;

  @override
  void dispose() {
    _contentController.dispose();
    for (final c in _pollControllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).value;

    return Scaffold(
      backgroundColor: AnonUTheme.bgCream,
      appBar: AppBar(
        backgroundColor: AnonUTheme.bgCream,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Center(
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AnonUTheme.bgSurface,
                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                  border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
                  boxShadow: const [
                    BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
                  ],
                ),
                child: const Icon(Icons.close_rounded, size: 20, color: AnonUTheme.black),
              ),
            ),
          ),
        ),
        title: const Text('NEW CAMPUS POST'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: BrutalistButton(
              text: 'PUBLISH →',
              backgroundColor: _canPost ? AnonUTheme.popYellow : const Color(0xFFE5E2D9),
              isLoading: _loading,
              shadowOffset: const Offset(2.5, 2.5),
              onPressed: _canPost && !_loading ? _submit : null,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Identity Toggle ──────────────────────────────────────────
            _IdentitySelector(
              identity: _identity,
              hasProfile: user?.hasIdentifiedProfile ?? false,
              pseudonym: user?.pseudonym ?? 'Anonymous',
              displayName: user?.displayName,
              onChanged: (val) => setState(() => _identity = val),
            ),
            const SizedBox(height: 16),

            // ── Main Text Input Box ──────────────────────────────────────
            BrutalistCard(
              padding: const EdgeInsets.all(14),
              backgroundColor: AnonUTheme.bgSurface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _contentController,
                    onChanged: (_) => setState(() {}),
                    maxLines: null,
                    minLines: 5,
                    style: const TextStyle(
                      color: AnonUTheme.black,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      height: 1.45,
                    ),
                    decoration: const InputDecoration(
                      hintText: "What's happening on campus? Speak freely...",
                      hintStyle: TextStyle(
                        color: AnonUTheme.textMuted,
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: _charCount > AnonUConstants.maxPostLength
                              ? AnonUTheme.downvoteRed
                              : AnonUTheme.bgCream,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AnonUTheme.black, width: 1.5),
                        ),
                        child: Text(
                          '$_charCount / ${AnonUConstants.maxPostLength}',
                          style: TextStyle(
                            color: _charCount > AnonUConstants.maxPostLength
                                ? Colors.white
                                : AnonUTheme.black,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ── Multi-Format Bar: Poll, Images, Expiry TTL ───────────────
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _OptionPill(
                  icon: Icons.poll_rounded,
                  label: 'POLL',
                  active: _type == PostType.poll,
                  activeColor: AnonUTheme.popMint,
                  onTap: () => setState(() {
                    _type = _type == PostType.poll ? PostType.text : PostType.poll;
                  }),
                ),
                _OptionPill(
                  icon: Icons.photo_library_rounded,
                  label: 'IMAGES (${_images.length}/${AnonUConstants.maxImages})',
                  active: _type == PostType.image || _images.isNotEmpty,
                  activeColor: AnonUTheme.popCyan,
                  onTap: () {
                    setState(() {
                      _type = _type == PostType.image ? PostType.text : PostType.image;
                    });
                    if (_type == PostType.image && _images.isEmpty) {
                      _pickImages();
                    }
                  },
                ),
                _ExpiryPickerPill(
                  value: _timeLimitHours,
                  onChanged: (hours) => setState(() => _timeLimitHours = hours),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Poll Configuration Block ─────────────────────────────────
            if (_type == PostType.poll) ...[
              BrutalistCard(
                padding: const EdgeInsets.all(16),
                backgroundColor: AnonUTheme.bgSurface,
                child: _PollCreator(
                  controllers: _pollControllers,
                  endsAt: _pollEndsAt,
                  onAddOption: () {
                    if (_pollControllers.length < AnonUConstants.maxPollOptions) {
                      setState(() => _pollControllers.add(TextEditingController()));
                    }
                  },
                  onRemoveOption: (i) {
                    if (_pollControllers.length > 2) {
                      setState(() => _pollControllers.removeAt(i));
                    }
                  },
                  onEndsAtChanged: (dt) => setState(() => _pollEndsAt = dt),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Image Attachment Panel ───────────────────────────────────
            if (_type == PostType.image || _images.isNotEmpty) ...[
              BrutalistCard(
                padding: const EdgeInsets.all(16),
                backgroundColor: AnonUTheme.bgSurface,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.photo_library_rounded, size: 18, color: AnonUTheme.black),
                        const SizedBox(width: 6),
                        const Text(
                          'ATTACHED IMAGES',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 12.5,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const Spacer(),
                        if (_images.length < AnonUConstants.maxImages)
                          GestureDetector(
                            onTap: _pickImages,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AnonUTheme.popCyan,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: AnonUTheme.black, width: 1.5),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.add_a_photo_rounded, size: 14, color: AnonUTheme.black),
                                  SizedBox(width: 4),
                                  Text(
                                    'ADD MORE',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 10.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (_images.isEmpty)
                      GestureDetector(
                        onTap: _pickImages,
                        child: Container(
                          height: 90,
                          decoration: BoxDecoration(
                            color: AnonUTheme.bgCream,
                            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                            border: Border.all(color: AnonUTheme.black, width: 2),
                          ),
                          child: const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.cloud_upload_outlined, size: 28, color: AnonUTheme.black),
                                SizedBox(height: 4),
                                Text(
                                  'TAP TO CHOOSE UP TO 4 IMAGES',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: _images.map((image) {
                          return Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                width: 90,
                                height: 90,
                                decoration: BoxDecoration(
                                  color: AnonUTheme.bgCream,
                                  borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                                  border: Border.all(color: AnonUTheme.black, width: 2),
                                ),
                                padding: const EdgeInsets.all(4),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.image_rounded, size: 28, color: AnonUTheme.black),
                                    const SizedBox(height: 4),
                                    Text(
                                      image.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                top: -6,
                                right: -6,
                                child: GestureDetector(
                                  onTap: () => setState(() => _images.remove(image)),
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: BoxDecoration(
                                      color: AnonUTheme.downvoteRed,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: AnonUTheme.black, width: 1.5),
                                    ),
                                    child: const Icon(Icons.close_rounded, size: 12, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Tag Picker ───────────────────────────────────────────────
            BrutalistCard(
              padding: const EdgeInsets.all(16),
              backgroundColor: AnonUTheme.bgSurface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.tag_rounded, size: 18, color: AnonUTheme.black),
                      SizedBox(width: 6),
                      Text(
                        'CAMPUS TOPICS & TAGS',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 12.5,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: AnonUConstants.suggestedTags.map((t) {
                      final isSelected = _selectedTags.contains(t);
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            if (isSelected) {
                              _selectedTags.remove(t);
                            } else if (_selectedTags.length < AnonUConstants.maxTags) {
                              _selectedTags.add(t);
                            }
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isSelected ? AnonUTheme.popCyan : AnonUTheme.bgCream,
                            borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                            border: Border.all(color: AnonUTheme.black, width: 1.5),
                            boxShadow: isSelected
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
                            '#$t',
                            style: TextStyle(
                              color: AnonUTheme.black,
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_canPost) return;
    setState(() => _loading = true);

    try {
      final user = ref.read(currentUserProvider).value;
      final postService = ref.read(postServiceProvider);
      final imageUrls = _images.isNotEmpty
          ? await _uploadImages()
          : <String>[];

      PollData? poll;
      if (_type == PostType.poll) {
        final options = _pollControllers
            .map((c) => c.text.trim())
            .where((t) => t.isNotEmpty)
            .toList();
        if (options.length >= 2) {
          poll = PollData(
            options: options,
            votes: {},
            userVotes: {},
            endsAt: _pollEndsAt,
          );
        }
      }

      await postService.createPost(
        identity: _identity,
        content: _contentController.text.trim(),
        type: _images.isNotEmpty
            ? PostType.image
            : (_type == PostType.poll ? PostType.poll : PostType.text),
        tags: _selectedTags,
        imageUrls: imageUrls,
        poll: poll,
        timeLimitHours: _timeLimitHours,
        currentUser: user,
      );

      if (mounted) context.pop();
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AnonUTheme.downvoteRed,
            content: Text(
              'Failed to publish post: $e',
              style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ),
        );
      }
    }
  }

  Future<void> _pickImages() async {
    final remaining = AnonUConstants.maxImages - _images.length;
    if (remaining <= 0) return;
    final picked = await _picker.pickMultiImage(
      imageQuality: 82,
      limit: remaining,
    );
    if (picked.isEmpty) return;
    setState(() {
      _images.addAll(picked.take(remaining));
      if (_images.isNotEmpty) _type = PostType.image;
    });
  }

  Future<List<String>> _uploadImages() async {
    final uid = ref.read(authServiceProvider).currentUser!.uid;
    final urls = <String>[];
    for (final image in _images) {
      final bytes = await image.readAsBytes();
      final safeName = image.name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
      final ref = FirebaseStorage.instance.ref(
        'posts/$uid/${DateTime.now().microsecondsSinceEpoch}_$safeName',
      );
      final metadata = SettableMetadata(
        contentType: image.mimeType ?? 'image/jpeg',
        customMetadata: {'ownerUid': uid},
      );
      final task = await ref.putData(bytes, metadata);
      urls.add(await task.ref.getDownloadURL());
    }
    return urls;
  }
}

class _IdentitySelector extends StatelessWidget {
  final PostIdentity identity;
  final bool hasProfile;
  final String pseudonym;
  final String? displayName;
  final ValueChanged<PostIdentity> onChanged;

  const _IdentitySelector({
    required this.identity,
    required this.hasProfile,
    required this.pseudonym,
    required this.displayName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AnonUTheme.bgSurface,
        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
        border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
        boxShadow: const [
          BoxShadow(color: AnonUTheme.black, offset: Offset(2.5, 2.5), blurRadius: 0),
        ],
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(
            child: _IdentityCard(
              title: pseudonym,
              subtitle: 'ANONYMOUS MASK',
              emoji: '🎭',
              isSelected: identity == PostIdentity.anonymous,
              accentColor: AnonUTheme.popMint,
              onTap: () => onChanged(PostIdentity.anonymous),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: _IdentityCard(
              title: displayName ?? 'PROFILE NOT SET',
              subtitle: 'VERIFIED REAL NAME',
              emoji: '👤',
              isSelected: identity == PostIdentity.identified,
              accentColor: AnonUTheme.popYellow,
              disabled: !hasProfile,
              onTap: hasProfile ? () => onChanged(PostIdentity.identified) : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _IdentityCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String emoji;
  final bool isSelected;
  final Color accentColor;
  final bool disabled;
  final VoidCallback? onTap;

  const _IdentityCard({
    required this.title,
    required this.subtitle,
    required this.emoji,
    required this.isSelected,
    required this.accentColor,
    this.disabled = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? accentColor : Colors.transparent,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm - 2),
          border: isSelected
              ? Border.all(color: AnonUTheme.black, width: 1.5)
              : null,
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: disabled ? AnonUTheme.textMuted : AnonUTheme.black,
                      fontWeight: FontWeight.w900,
                      fontSize: 12.5,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: AnonUTheme.black,
                      fontWeight: FontWeight.w700,
                      fontSize: 9.5,
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OptionPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _OptionPill({
    required this.icon,
    required this.label,
    required this.active,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? activeColor : AnonUTheme.bgSurface,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
          border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
          boxShadow: const [
            BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AnonUTheme.black),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: AnonUTheme.black,
                fontWeight: FontWeight.w900,
                fontSize: 12,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExpiryPickerPill extends StatelessWidget {
  final int? value;
  final ValueChanged<int?> onChanged;

  const _ExpiryPickerPill({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final label = value != null ? 'EXPIRES IN ${value}H' : 'EXPIRY: NEVER';

    return GestureDetector(
      onTap: () => _showExpirySheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: value != null ? AnonUTheme.popOrange : AnonUTheme.bgSurface,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
          border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidthThin),
          boxShadow: const [
            BoxShadow(color: AnonUTheme.black, offset: Offset(2, 2), blurRadius: 0),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.timer_outlined, size: 16, color: AnonUTheme.black),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: AnonUTheme.black,
                fontWeight: FontWeight.w900,
                fontSize: 12,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showExpirySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'SET POST EXPIRATION TTL',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
            ),
            const SizedBox(height: 6),
            const Text(
              'Expired posts will self-destruct and disappear from the campus feed.',
              style: TextStyle(color: AnonUTheme.textSecondary, fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            _expiryTile(context, null, 'NEVER (PERMANENT POST)'),
            ...AnonUConstants.timeLimitOptions.map(
              (h) => _expiryTile(context, h, '$h HOUR${h == 1 ? "" : "S"} (${h < 24 ? "$h hours" : "${h ~/ 24} day"})'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _expiryTile(BuildContext context, int? hours, String label) {
    final isSelected = value == hours;
    return GestureDetector(
      onTap: () {
        onChanged(hours);
        Navigator.pop(context);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AnonUTheme.popYellow : AnonUTheme.bgCream,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
          border: Border.all(color: AnonUTheme.black, width: 1.5),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
              size: 18,
              color: AnonUTheme.black,
            ),
            const SizedBox(width: 10),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PollCreator extends StatelessWidget {
  final List<TextEditingController> controllers;
  final DateTime endsAt;
  final VoidCallback onAddOption;
  final ValueChanged<int> onRemoveOption;
  final ValueChanged<DateTime> onEndsAtChanged;

  const _PollCreator({
    required this.controllers,
    required this.endsAt,
    required this.onAddOption,
    required this.onRemoveOption,
    required this.onEndsAtChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(
          children: [
            Icon(Icons.bar_chart_rounded, size: 18, color: AnonUTheme.black),
            SizedBox(width: 6),
            Text(
              'POLL OPTIONS (2-4)',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12.5,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...List.generate(controllers.length, (i) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AnonUTheme.black,
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(AnonUTheme.radiusSm)),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    String.fromCharCode(65 + i),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                ),
                Expanded(
                  child: Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: AnonUTheme.bgCream,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(AnonUTheme.radiusSm)),
                      border: Border.all(color: AnonUTheme.black, width: 2),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    alignment: Alignment.center,
                    child: TextField(
                      controller: controllers[i],
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                      decoration: InputDecoration(
                        hintText: 'Option ${i + 1}',
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                ),
                if (controllers.length > 2) ...[
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => onRemoveOption(i),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AnonUTheme.downvoteRed,
                        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
                        border: Border.all(color: AnonUTheme.black, width: 1.5),
                      ),
                      child: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
        if (controllers.length < AnonUConstants.maxPollOptions) ...[
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerLeft,
            child: BrutalistButton(
              text: '+ ADD OPTION',
              backgroundColor: AnonUTheme.popMint,
              shadowOffset: const Offset(2, 2),
              onPressed: onAddOption,
            ),
          ),
        ],
      ],
    );
  }
}
