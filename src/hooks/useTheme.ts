import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, ThemeColors } from '../constants/theme';
import { useThemeStore, ThemeMode } from '../stores/useThemeStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore((s) => s.themeMode);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const highContrast = useThemeStore((s) => s.highContrast);
  const hapticsEnabled = useThemeStore((s) => s.hapticsEnabled);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const setReducedMotion = useThemeStore((s) => s.setReducedMotion);
  const setHighContrast = useThemeStore((s) => s.setHighContrast);
  const setHapticsEnabled = useThemeStore((s) => s.setHapticsEnabled);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const theme: ThemeColors = isDark ? DarkTheme : LightTheme;

  return {
    theme,
    isDark,
    themeMode,
    reducedMotion,
    highContrast,
    hapticsEnabled,
    setThemeMode,
    setReducedMotion,
    setHighContrast,
    setHapticsEnabled,
  };
}
