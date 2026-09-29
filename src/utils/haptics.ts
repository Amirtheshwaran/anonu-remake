import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../stores/useThemeStore';

export const hapticFeedback = {
  async light() {
    if (!useThemeStore.getState().hapticsEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  async medium() {
    if (!useThemeStore.getState().hapticsEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },

  async heavy() {
    if (!useThemeStore.getState().hapticsEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },

  async success() {
    if (!useThemeStore.getState().hapticsEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  async warning() {
    if (!useThemeStore.getState().hapticsEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  },

  async error() {
    if (!useThemeStore.getState().hapticsEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  },
};
