import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { AppUser } from '../types';

interface AuthState {
  firebaseUser: User | null;
  appUser: AppUser | null;
  isLoading: boolean;
  setFirebaseUser: (user: User | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  appUser: null,
  isLoading: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setAppUser: (appUser) => set({ appUser }),
  setLoading: (isLoading) => set({ isLoading })
}));
