import { create } from 'zustand';

interface UIState {
  feedTabIndex: number;
  unreadAlertsCount: number;
  setFeedTabIndex: (index: number) => void;
  setUnreadAlertsCount: (count: number) => void;
  decrementUnreadAlerts: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  feedTabIndex: 0,
  unreadAlertsCount: 0,
  setFeedTabIndex: (feedTabIndex) => set({ feedTabIndex }),
  setUnreadAlertsCount: (unreadAlertsCount) => set({ unreadAlertsCount }),
  decrementUnreadAlerts: () =>
    set((state) => ({ unreadAlertsCount: Math.max(0, state.unreadAlertsCount - 1) })),
}));
