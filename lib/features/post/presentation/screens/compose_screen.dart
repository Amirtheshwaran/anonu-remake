import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:anonu/core/theme/app_theme.dart';
import 'package:anonu/core/constants/constants.dart';
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
      backgroundColor: AnonUTheme.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('New Post'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _PostButton(
              enabled: _canPost && !_loading,
              loading: _loading,
              onPost: _submit,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Identity toggle ────────────────────────────────
            _IdentityToggle(
              value: _identity,
              hasProfile: user?.hasIdentifiedProfile ?? false,
              pseudonym: user?.pseudonym ?? 'Anonymous',
              displayName: user?.displayName,
              onChanged: (v) => setState(() => _identity = v),
            ),
            const SizedBox(height: 16),

            // ── Content input ──────────────────────────────────
            TextField(
              controller: _contentController,
              onChanged: (_) => setState(() {}),
              maxLines: null,
              minLines: 5,
              style: const TextStyle(
                color: AnonUTheme.textPrimary,
                fontSize: 16,
                height: 1.5,
              ),
              decoration: const InputDecoration(
                hintText: "What's on your mind?",
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
              ),
            ),

            // Char counter
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                '${_charCount}/${AnonUConstants.maxPostLength}',
                style: TextStyle(
                  color: _charCount > AnonUConstants.maxPostLength
                      ? AnonUTheme.downvote
                      : AnonUTheme.textMuted,
                  fontSize: 12,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // ── Poll builder ───────────────────────────────────
            if (_type == PostType.poll) ...[
              _PollBuilder(
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
              const SizedBox(height: 16),
            ],

            // ── Tags ───────────────────────────────────────────
            _TagSelector(
              selected: _selectedTags,
              onToggle: (tag) => setState(() {
                if (_selectedTags.contains(tag)) {
                  _selectedTags.remove(tag);
                } else if (_selectedTags.length < AnonUConstants.maxTags) {
                  _selectedTags.add(tag);
                }
              }),
            ),

            const SizedBox(height: 16),

            // ── Options row ────────────────────────────────────
            _OptionsRow(
              type: _type,
              timeLimitHours: _timeLimitHours,
              onTypeChange: (t) => setState(() => _type = t),
              onTimeLimitChange: (h) => setState(() => _timeLimitHours = h),
            ),

            if (_type == PostType.image) ...[
              const SizedBox(height: 16),
              _ImagePickerPanel(
                images: _images,
                onAdd: _pickImages,
                onRemove: (image) => setState(() => _images.remove(image)),
              ),
            ],
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
      final imageUrls = _type == PostType.image
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
        type: _type,
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
          SnackBar(content: Text('Error: $e')),
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
    setState(() => _images.addAll(picked.take(remaining)));
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

class _ImagePickerPanel extends StatelessWidget {
  final List<XFile> images;
  final VoidCallback onAdd;
  final ValueChanged<XFile> onRemove;

  const _ImagePickerPanel({
    required this.images,
    required this.onAdd,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Images',
              style: TextStyle(
                color: AnonUTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: images.length >= AnonUConstants.maxImages ? null : onAdd,
              icon: const Icon(Icons.add_photo_alternate_outlined, size: 16),
              label: Text('${images.length}/${AnonUConstants.maxImages}'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (images.isEmpty)
          InkWell(
            onTap: onAdd,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              height: 84,
              decoration: BoxDecoration(
                color: AnonUTheme.surfaceVariant,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AnonUTheme.border),
              ),
              child: const Center(
                child: Icon(
                  Icons.add_photo_alternate_outlined,
                  color: AnonUTheme.textMuted,
                ),
              ),
            ),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: images.map((image) {
              return Container(
                width: 104,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AnonUTheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AnonUTheme.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.image_outlined,
                        size: 16, color: AnonUTheme.textMuted),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        image.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AnonUTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => onRemove(image),
                      child: const Icon(Icons.close_rounded,
                          size: 15, color: AnonUTheme.textMuted),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
      ],
    );
  }
}

class _PostButton extends StatelessWidget {
  final bool enabled;
  final bool loading;
  final VoidCallback onPost;

  const _PostButton({
    required this.enabled,
    required this.loading,
    required this.onPost,
  });

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: enabled ? onPost : null,
      style: TextButton.styleFrom(
        foregroundColor: AnonUTheme.maroonLight,
        disabledForegroundColor: AnonUTheme.textMuted,
        padding: const EdgeInsets.symmetric(horizontal: 12),
      ),
      child: loading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AnonUTheme.maroonLight,
              ),
            )
          : const Text(
              'Post',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
    );
  }
}

class _IdentityToggle extends StatelessWidget {
  final PostIdentity value;
  final bool hasProfile;
  final String pseudonym;
  final String? displayName;
  final Function(PostIdentity) onChanged;

  const _IdentityToggle({
    required this.value,
    required this.hasProfile,
    required this.pseudonym,
    this.displayName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AnonUTheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _ToggleOption(
            label: pseudonym,
            sublabel: 'Anonymous',
            emoji: '🎭',
            selected: value == PostIdentity.anonymous,
            onTap: () => onChanged(PostIdentity.anonymous),
          ),
          _ToggleOption(
            label: displayName ?? 'Set up profile',
            sublabel: 'Identified',
            emoji: '👤',
            selected: value == PostIdentity.identified,
            onTap: hasProfile ? () => onChanged(PostIdentity.identified) : null,
            disabled: !hasProfile,
          ),
        ],
      ),
    );
  }
}

class _ToggleOption extends StatelessWidget {
  final String label;
  final String sublabel;
  final String emoji;
  final bool selected;
  final VoidCallback? onTap;
  final bool disabled;

  const _ToggleOption({
    required this.label,
    required this.sublabel,
    required this.emoji,
    required this.selected,
    this.onTap,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: disabled ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          decoration: BoxDecoration(
            color: selected ? AnonUTheme.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        color: disabled
                            ? AnonUTheme.textMuted
                            : AnonUTheme.textPrimary,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      sublabel,
                      style: const TextStyle(
                        color: AnonUTheme.textMuted,
                        fontSize: 10.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TagSelector extends StatelessWidget {
  final List<String> selected;
  final Function(String) onToggle;

  const _TagSelector({required this.selected, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tags',
            style: TextStyle(
                color: AnonUTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: AnonUConstants.suggestedTags.map((tag) {
            final isSelected = selected.contains(tag);
            return GestureDetector(
              onTap: () => onToggle(tag),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AnonUTheme.maroon.withOpacity(0.2)
                      : AnonUTheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected
                        ? AnonUTheme.maroon.withOpacity(0.6)
                        : AnonUTheme.border,
                    width: 0.5,
                  ),
                ),
                child: Text(
                  '#$tag',
                  style: TextStyle(
                    color: isSelected
                        ? AnonUTheme.maroonLight
                        : AnonUTheme.textMuted,
                    fontSize: 12,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _OptionsRow extends StatelessWidget {
  final PostType type;
  final int? timeLimitHours;
  final Function(PostType) onTypeChange;
  final Function(int?) onTimeLimitChange;

  const _OptionsRow({
    required this.type,
    required this.timeLimitHours,
    required this.onTypeChange,
    required this.onTimeLimitChange,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _IconToggle(
          icon: Icons.bar_chart_rounded,
          label: 'Poll',
          active: type == PostType.poll,
          onTap: () => onTypeChange(
              type == PostType.poll ? PostType.text : PostType.poll),
        ),
        const SizedBox(width: 8),
        _IconToggle(
          icon: Icons.image_outlined,
          label: 'Image',
          active: type == PostType.image,
          onTap: () => onTypeChange(
              type == PostType.image ? PostType.text : PostType.image),
        ),
        const SizedBox(width: 8),
        _TimeLimitPicker(
          value: timeLimitHours,
          onChanged: onTimeLimitChange,
        ),
      ],
    );
  }
}

class _IconToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _IconToggle({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AnonUTheme.maroon.withOpacity(0.15) : AnonUTheme.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: active ? AnonUTheme.maroon.withOpacity(0.5) : AnonUTheme.border,
          ),
        ),
        child: Row(
          children: [
            Icon(icon,
                size: 16,
                color: active ? AnonUTheme.maroon : AnonUTheme.textMuted),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                    color: active ? AnonUTheme.maroon : AnonUTheme.textMuted,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class _TimeLimitPicker extends StatelessWidget {
  final int? value;
  final Function(int?) onChanged;

  const _TimeLimitPicker({this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        backgroundColor: AnonUTheme.surface,
        builder: (_) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Post expires after...',
                  style: TextStyle(
                      color: AnonUTheme.textPrimary,
                      fontWeight: FontWeight.w600)),
            ),
            ListTile(
              title: const Text('Never', style: TextStyle(color: AnonUTheme.textPrimary)),
              trailing: value == null ? const Icon(Icons.check, color: AnonUTheme.maroon) : null,
              onTap: () { onChanged(null); Navigator.pop(context); },
            ),
            ...AnonUConstants.timeLimitOptions.map((h) => ListTile(
              title: Text(h < 24 ? '$h hours' : '${h ~/ 24} day${h > 24 ? 's' : ''}',
                  style: const TextStyle(color: AnonUTheme.textPrimary)),
              trailing: value == h ? const Icon(Icons.check, color: AnonUTheme.maroon) : null,
              onTap: () { onChanged(h); Navigator.pop(context); },
            )),
          ],
        ),
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: value != null ? AnonUTheme.maroon.withOpacity(0.15) : AnonUTheme.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: value != null ? AnonUTheme.maroon.withOpacity(0.5) : AnonUTheme.border,
          ),
        ),
        child: Row(
          children: [
            Icon(Icons.timer_outlined,
                size: 16,
                color: value != null ? AnonUTheme.maroon : AnonUTheme.textMuted),
            const SizedBox(width: 4),
            Text(
              value != null
                  ? (value! < 24 ? '${value}h' : '${value! ~/ 24}d')
                  : 'Timer',
              style: TextStyle(
                color: value != null ? AnonUTheme.maroon : AnonUTheme.textMuted,
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PollBuilder extends StatelessWidget {
  final List<TextEditingController> controllers;
  final DateTime endsAt;
  final VoidCallback onAddOption;
  final Function(int) onRemoveOption;
  final Function(DateTime) onEndsAtChanged;

  const _PollBuilder({
    required this.controllers,
    required this.endsAt,
    required this.onAddOption,
    required this.onRemoveOption,
    required this.onEndsAtChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Poll Options',
            style: TextStyle(
                color: AnonUTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...List.generate(controllers.length, (i) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controllers[i],
                  style: const TextStyle(color: AnonUTheme.textPrimary, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Option ${i + 1}',
                    isDense: true,
                  ),
                ),
              ),
              if (controllers.length > 2)
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline,
                      color: AnonUTheme.downvote, size: 20),
                  onPressed: () => onRemoveOption(i),
                ),
            ],
          ),
        )),
        if (controllers.length < AnonUConstants.maxPollOptions)
          TextButton.icon(
            onPressed: onAddOption,
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Add option'),
            style: TextButton.styleFrom(foregroundColor: AnonUTheme.maroon),
          ),
      ],
    );
  }
}
