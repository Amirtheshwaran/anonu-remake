import { create } from 'zustand';
import { UserModel } from '../types/user';

interface AuthState {
  user: UserModel | null;
  firebaseUser: any | null;
  selectedCampusId: string;
  isLoading: boolean;
  setUser: (user: UserModel | null) => void;
  setFirebaseUser: (fbUser: any | null) => void;
  setSelectedCampusId: (campusId: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  selectedCampusId: 'uncc',
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      selectedCampusId: user?.campusId || 'uncc',
    }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setSelectedCampusId: (selectedCampusId) => set({ selectedCampusId }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      firebaseUser: null,
      selectedCampusId: 'uncc',
      isLoading: false,
    }),
}));
