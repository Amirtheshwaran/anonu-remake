import { create } from 'zustand';
import { UserModel } from '../types/user';

interface AuthState {
  user: UserModel | null;
  firebaseUser: any | null;
  isLoading: boolean;
  setUser: (user: UserModel | null) => void;
  setFirebaseUser: (fbUser: any | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, firebaseUser: null, isLoading: false }),
}));
