import 'package:flutter/material.dart';
import 'package:anonu/core/theme/app_theme.dart';

/// ─────────────────────────────────────────────────────────────
/// BRUTALIST CARD
/// ─────────────────────────────────────────────────────────────
class BrutalistCard extends StatelessWidget {
  final Widget child;
  final Color backgroundColor;
  final Color borderColor;
  final double borderWidth;
  final double borderRadius;
  final Offset shadowOffset;
  final Color shadowColor;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final bool hasShadow;

  const BrutalistCard({
    super.key,
    required this.child,
    this.backgroundColor = AnonUTheme.bgSurface,
    this.borderColor = AnonUTheme.black,
    this.borderWidth = AnonUTheme.borderWidth,
    this.borderRadius = AnonUTheme.radiusSm,
    this.shadowOffset = AnonUTheme.shadowOffset,
    this.shadowColor = AnonUTheme.black,
    this.padding,
    this.margin,
    this.onTap,
    this.hasShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    final cardContent = Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: hasShadow
            ? [
                BoxShadow(
                  color: shadowColor,
                  offset: shadowOffset,
                  blurRadius: 0,
                  spreadRadius: 0,
                ),
              ]
            : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: cardContent,
      );
    }
    return cardContent;
  }
}

/// ─────────────────────────────────────────────────────────────
/// BRUTALIST BUTTON (Tactile Press Interaction)
/// ─────────────────────────────────────────────────────────────
class BrutalistButton extends StatefulWidget {
  final String? text;
  final Widget? icon;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color textColor;
  final Color borderColor;
  final double borderWidth;
  final double borderRadius;
  final Offset shadowOffset;
  final EdgeInsetsGeometry padding;
  final bool isFullWidth;
  final bool isLoading;
  final double? height;

  const BrutalistButton({
    super.key,
    this.text,
    this.icon,
    required this.onPressed,
    this.backgroundColor = AnonUTheme.popYellow,
    this.textColor = AnonUTheme.textBlack,
    this.borderColor = AnonUTheme.black,
    this.borderWidth = AnonUTheme.borderWidth,
    this.borderRadius = AnonUTheme.radiusSm,
    this.shadowOffset = AnonUTheme.shadowOffset,
    this.padding = const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
    this.isFullWidth = false,
    this.isLoading = false,
    this.height,
  });

  @override
  State<BrutalistButton> createState() => _BrutalistButtonState();
}

class _BrutalistButtonState extends State<BrutalistButton> {
  bool _isPressed = false;

  void _handleTapDown(TapDownDetails _) {
    if (widget.onPressed != null && !widget.isLoading) {
      setState(() => _isPressed = true);
    }
  }

  void _handleTapUp(TapUpDetails _) {
    if (_isPressed) {
      setState(() => _isPressed = false);
    }
  }

  void _handleTapCancel() {
    if (_isPressed) {
      setState(() => _isPressed = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = widget.onPressed != null && !widget.isLoading;
    final effectiveShadow = _isPressed || !isEnabled
        ? Offset.zero
        : widget.shadowOffset;
    final translation = _isPressed
        ? widget.shadowOffset
        : Offset.zero;

    Widget buttonContent = Row(
      mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isLoading) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              valueColor: AlwaysStoppedAnimation<Color>(widget.textColor),
            ),
          ),
          const SizedBox(width: 8),
        ] else if (widget.icon != null) ...[
          widget.icon!,
          if (widget.text != null) const SizedBox(width: 8),
        ],
        if (widget.text != null)
          Text(
            widget.text!,
            style: TextStyle(
              color: widget.textColor,
              fontWeight: FontWeight.w800,
              fontSize: 14.5,
              letterSpacing: 0.2,
            ),
          ),
      ],
    );

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: isEnabled ? widget.onPressed : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 75),
        transform: Matrix4.translationValues(translation.dx, translation.dy, 0),
        height: widget.height,
        padding: widget.padding,
        decoration: BoxDecoration(
          color: isEnabled
              ? widget.backgroundColor
              : const Color(0xFFD4D4D4),
          borderRadius: BorderRadius.circular(widget.borderRadius),
          border: Border.all(color: widget.borderColor, width: widget.borderWidth),
          boxShadow: [
            BoxShadow(
              color: widget.borderColor,
              offset: effectiveShadow,
              blurRadius: 0,
              spreadRadius: 0,
            ),
          ],
        ),
        child: buttonContent,
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
/// BRUTALIST BADGE / STICKER
/// ─────────────────────────────────────────────────────────────
class BrutalistBadge extends StatelessWidget {
  final String label;
  final Widget? icon;
  final Color backgroundColor;
  final Color textColor;
  final Color borderColor;
  final double borderWidth;
  final double borderRadius;
  final double fontSize;
  final bool hasShadow;
  final VoidCallback? onTap;

  const BrutalistBadge({
    super.key,
    required this.label,
    this.icon,
    this.backgroundColor = AnonUTheme.popMint,
    this.textColor = AnonUTheme.textBlack,
    this.borderColor = AnonUTheme.black,
    this.borderWidth = AnonUTheme.borderWidthThin,
    this.borderRadius = AnonUTheme.radiusSm,
    this.fontSize = 11.5,
    this.hasShadow = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final badge = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: hasShadow
            ? [
                BoxShadow(
                  color: borderColor,
                  offset: const Offset(2.0, 2.0),
                  blurRadius: 0,
                ),
              ]
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            icon!,
            const SizedBox(width: 4),
          ],
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w800,
              fontSize: fontSize,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: badge,
      );
    }
    return badge;
  }
}

/// ─────────────────────────────────────────────────────────────
/// BRUTALIST TEXT FIELD
/// ─────────────────────────────────────────────────────────────
class BrutalistTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? hintText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final int? maxLines;
  final int? minLines;
  final ValueChanged<String>? onChanged;
  final String? Function(String?)? validator;
  final bool autofocus;
  final Color backgroundColor;

  const BrutalistTextField({
    super.key,
    this.controller,
    this.hintText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.maxLines = 1,
    this.minLines,
    this.onChanged,
    this.validator,
    this.autofocus = false,
    this.backgroundColor = AnonUTheme.bgSurface,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AnonUTheme.radiusSm),
        border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidth),
        boxShadow: const [
          BoxShadow(
            color: AnonUTheme.black,
            offset: AnonUTheme.shadowOffsetSm,
            blurRadius: 0,
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        maxLines: maxLines,
        minLines: minLines,
        onChanged: onChanged,
        validator: validator,
        autofocus: autofocus,
        style: const TextStyle(
          color: AnonUTheme.textBlack,
          fontWeight: FontWeight.w600,
          fontSize: 14.5,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: const TextStyle(
            color: AnonUTheme.textMuted,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
/// BRUTALIST CONFIRMATION / ALERT MODAL
/// ─────────────────────────────────────────────────────────────
class BrutalistDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final Color confirmColor;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;

  const BrutalistDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmLabel = 'CONFIRM',
    this.cancelLabel = 'CANCEL',
    this.confirmColor = AnonUTheme.popYellow,
    required this.onConfirm,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AnonUTheme.bgSurface,
          borderRadius: BorderRadius.circular(AnonUTheme.radiusMd),
          border: Border.all(color: AnonUTheme.black, width: AnonUTheme.borderWidth),
          boxShadow: const [
            BoxShadow(
              color: AnonUTheme.black,
              offset: AnonUTheme.shadowOffsetLg,
              blurRadius: 0,
            ),
          ],
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
                    color: confirmColor,
                    border: Border.all(color: AnonUTheme.black, width: 2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.warning_amber_rounded, size: 20, color: AnonUTheme.black),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AnonUTheme.textBlack,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AnonUTheme.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                BrutalistButton(
                  text: cancelLabel,
                  backgroundColor: const Color(0xFFECECEC),
                  shadowOffset: const Offset(2, 2),
                  onPressed: onCancel ?? () => Navigator.pop(context),
                ),
                const SizedBox(width: 10),
                BrutalistButton(
                  text: confirmLabel,
                  backgroundColor: confirmColor,
                  shadowOffset: const Offset(2, 2),
                  onPressed: onConfirm,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
