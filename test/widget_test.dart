import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:anonu/core/theme/app_theme.dart';

void main() {
  test('brutalist theme is configured properly', () {
    expect(AnonUTheme.borderWidth, 3.0);
    expect(AnonUTheme.popYellow, const Color(0xFFFFE600));
    expect(AnonUTheme.popMint, const Color(0xFF00F090));
  });
}
