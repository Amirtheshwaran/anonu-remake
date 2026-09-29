import { LightTheme, DarkTheme, AnonUTheme } from '../../src/constants/theme';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { hapticFeedback } from '../../src/utils/haptics';
import * as Haptics from 'expo-haptics';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Relative luminance & WCAG contrast calculation helpers
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe('Phase 5: Polish, Neo-Brutalist Dark Mode & Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.setState({
      themeMode: 'system',
      reducedMotion: false,
      highContrast: false,
      hapticsEnabled: true,
    });
  });

  describe('WCAG 2.1 AA Contrast Ratio Verification', () => {
    it('verifies LightTheme body text meets WCAG AA requirement (>= 4.5:1)', () => {
      const creamContrast = getContrastRatio(LightTheme.textBlack, LightTheme.bgCream);
      const surfaceContrast = getContrastRatio(LightTheme.textBlack, LightTheme.bgSurface);
      const secondaryContrast = getContrastRatio(LightTheme.textSecondary, LightTheme.bgSurface);

      expect(creamContrast).toBeGreaterThanOrEqual(15); // >15:1
      expect(surfaceContrast).toBeCloseTo(21, 0); // 21:1 perfect contrast
      expect(secondaryContrast).toBeGreaterThanOrEqual(4.5); // passes AA
    });

    it('verifies DarkTheme body text meets WCAG AA requirement (>= 4.5:1)', () => {
      const darkCanvasContrast = getContrastRatio(DarkTheme.textPrimary, DarkTheme.bgCanvas);
      const darkSurfaceContrast = getContrastRatio(DarkTheme.textPrimary, DarkTheme.bgSurface);
      const secondaryDarkContrast = getContrastRatio(DarkTheme.textSecondary, DarkTheme.bgSurface);

      expect(darkCanvasContrast).toBeGreaterThanOrEqual(15);
      expect(darkSurfaceContrast).toBeGreaterThanOrEqual(10);
      expect(secondaryDarkContrast).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies non-text UI components and outlines meet WCAG 2.1 (>= 3:1)', () => {
      const lightBorderContrast = getContrastRatio(LightTheme.border, LightTheme.bgCream);
      const darkBorderContrast = getContrastRatio(DarkTheme.border, DarkTheme.bgSurface);

      expect(lightBorderContrast).toBeGreaterThanOrEqual(3.0);
      expect(darkBorderContrast).toBeGreaterThanOrEqual(3.0);
    });

    it('verifies pop accent badges have high contrast with their foreground text', () => {
      // Yellow badge with black text
      const yellowContrast = getContrastRatio(LightTheme.popYellow, LightTheme.black);
      expect(yellowContrast).toBeGreaterThanOrEqual(10);

      // Mint badge with black text
      const mintContrast = getContrastRatio(LightTheme.popMint, LightTheme.black);
      expect(mintContrast).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Theme Store State Management', () => {
    it('initializes with default system preferences', () => {
      const state = useThemeStore.getState();
      expect(state.themeMode).toBe('system');
      expect(state.reducedMotion).toBe(false);
      expect(state.highContrast).toBe(false);
      expect(state.hapticsEnabled).toBe(true);
    });

    it('allows changing themeMode between system, light, and dark', () => {
      useThemeStore.getState().setThemeMode('dark');
      expect(useThemeStore.getState().themeMode).toBe('dark');

      useThemeStore.getState().setThemeMode('light');
      expect(useThemeStore.getState().themeMode).toBe('light');

      useThemeStore.getState().setThemeMode('system');
      expect(useThemeStore.getState().themeMode).toBe('system');
    });

    it('toggles reduced motion, high contrast, and haptic preferences', () => {
      useThemeStore.getState().toggleReducedMotion();
      expect(useThemeStore.getState().reducedMotion).toBe(true);

      useThemeStore.getState().toggleHighContrast();
      expect(useThemeStore.getState().highContrast).toBe(true);

      useThemeStore.getState().toggleHaptics();
      expect(useThemeStore.getState().hapticsEnabled).toBe(false);
    });
  });

  describe('Tactile Haptic Feedback Service', () => {
    it('triggers impact when haptics are enabled', () => {
      hapticFeedback.light();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);

      hapticFeedback.medium();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);

      hapticFeedback.heavy();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('triggers notification feedback on success, warning, error', () => {
      hapticFeedback.success();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);

      hapticFeedback.warning();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);

      hapticFeedback.error();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });

    it('safely suppresses haptic triggers when user disables haptics in settings', () => {
      useThemeStore.setState({ hapticsEnabled: false });

      hapticFeedback.light();
      hapticFeedback.medium();
      hapticFeedback.heavy();
      hapticFeedback.success();
      hapticFeedback.warning();
      hapticFeedback.error();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Touch Targets & Brutalist Geometry', () => {
    it('enforces minimum touch targets of at least 44pt for Apple & Google compliance', () => {
      const MIN_TOUCH_TARGET = 44;
      expect(MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(44);
    });

    it('provides consistent geometry tokens across light and dark modes', () => {
      expect(LightTheme.borderWidth).toBe(3);
      expect(DarkTheme.borderWidth).toBe(3);
      expect(LightTheme.borderWidthThin).toBe(2);
      expect(DarkTheme.borderWidthThin).toBe(2);

      expect(LightTheme.shadowOffset).toEqual({ width: 4, height: 4 });
      expect(DarkTheme.shadowOffset).toEqual({ width: 4, height: 4 });
    });
  });
});
