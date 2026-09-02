import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AnonUTheme {
  // ── Signature Brutalist Palette ──────────────────────────────
  // Canvas & Surfaces
  static const Color bgCream = Color(0xFFFBF9F2);      // Signature off-white paper canvas
  static const Color bgSurface = Color(0xFFFFFFFF);    // Stark white card surfaces
  static const Color bgDark = Color(0xFF121212);       // Dark mode canvas
  static const Color bgDarkSurface = Color(0xFF1E1E1E);// Dark card surface

  // Outlines & Shadows
  static const Color black = Color(0xFF000000);
  static const Color white = Color(0xFFFFFFFF);
  static const Color borderDark = Color(0xFF000000);
  static const Color borderLight = Color(0xFF000000);

  // Vibrant Pop Accents (Neo-Brutalism Staples)
  static const Color popYellow = Color(0xFFFFE600);    // Electric highlighter yellow
  static const Color popMint = Color(0xFF00F090);      // High-octane mint/green
  static const Color popPink = Color(0xFFFF5C93);      // Punchy bubblegum/hot pink
  static const Color popCyan = Color(0xFF00E5FF);      // Cyber cyan
  static const Color popOrange = Color(0xFFFF5A1F);    // High-impact neon orange
  static const Color popPurple = Color(0xFFA388EE);    // Bright retro lavender/purple
  static const Color popMaroon = Color(0xFF8B0020);    // AnonU signature deep campus maroon

  // Text colors
  static const Color textBlack = Color(0xFF000000);
  static const Color textMuted = Color(0xFF5E5E5E);
  static const Color textMutedDark = Color(0xFF9E9E9E);
  static const Color textWhite = Color(0xFFFFFFFF);

  // Vote indicators
  static const Color upvoteGreen = Color(0xFF00D26A);
  static const Color downvoteRed = Color(0xFFFF334B);

  // ── Geometry Tokens ──────────────────────────────────────────
  static const double borderWidth = 3.0;
  static const double borderWidthThin = 2.0;
  static const double radiusSharp = 0.0;
  static const double radiusSm = 6.0;
  static const double radiusMd = 10.0;
  static const double radiusPill = 999.0;

  static const Offset shadowOffset = Offset(4.0, 4.0);
  static const Offset shadowOffsetSm = Offset(2.5, 2.5);
  static const Offset shadowOffsetLg = Offset(6.0, 6.0);

  static List<BoxShadow> hardShadow({
    Offset offset = shadowOffset,
    Color color = black,
  }) {
    return [
      BoxShadow(
        color: color,
        offset: offset,
        blurRadius: 0,
        spreadRadius: 0,
      ),
    ];
  }

  static BoxDecoration brutalistBox({
    Color backgroundColor = bgSurface,
    Color borderColor = black,
    double borderWidth = borderWidth,
    double borderRadius = radiusSm,
    Offset shadowOffset = shadowOffset,
    Color shadowColor = black,
    bool hasShadow = true,
  }) {
    return BoxDecoration(
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
    );
  }

  // ── Light Theme (Signature Neo-Brutalist) ─────────────────────
  static ThemeData get light {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme();
    final headerTextTheme = GoogleFonts.spaceGroteskTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgCream,
      colorScheme: const ColorScheme.light(
        primary: popYellow,
        secondary: popMint,
        tertiary: popPink,
        surface: bgSurface,
        error: downvoteRed,
        onPrimary: textBlack,
        onSecondary: textBlack,
        onSurface: textBlack,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: headerTextTheme.displayLarge?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w900,
          letterSpacing: -1.5,
        ),
        headlineLarge: headerTextTheme.headlineLarge?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w800,
          letterSpacing: -1.0,
        ),
        headlineMedium: headerTextTheme.headlineMedium?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        titleLarge: headerTextTheme.titleLarge?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w700,
        ),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w500,
          fontSize: 15,
        ),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w400,
          fontSize: 13.5,
        ),
        labelLarge: headerTextTheme.labelLarge?.copyWith(
          color: textBlack,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgCream,
        foregroundColor: textBlack,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textBlack,
          fontSize: 22,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: black,
        thickness: borderWidthThin,
        space: 0,
      ),
    );
  }

  // ── Aliases for backwards compatibility ──────
  static const Color background = bgCream;
  static const Color surface = bgSurface;
  static const Color surfaceVariant = Color(0xFFF0EBE1);
  static const Color border = black;
  static const Color maroon = popMaroon;
  static const Color maroonLight = Color(0xFFB3002A);
  static const Color textPrimary = textBlack;
  static const Color textSecondary = Color(0xFF4A4A4A);
  static const Color upvote = upvoteGreen;
  static const Color downvote = downvoteRed;
  static const Color anonGreen = popMint;

  static ThemeData get dark => light;
}
