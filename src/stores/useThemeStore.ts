import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  reducedMotion: boolean;
  highContrast: boolean;
  hapticsEnabled: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  toggleHaptics: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',
  reducedMotion: false,
  highContrast: false,
  hapticsEnabled: true,
  setThemeMode: (themeMode) => set({ themeMode }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setHighContrast: (highContrast) => set({ highContrast }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
}));
