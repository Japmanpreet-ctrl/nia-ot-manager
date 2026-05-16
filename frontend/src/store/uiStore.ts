import { create } from 'zustand';
import type { OTRecord } from '../types';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface UiState {
  selectedRecord: OTRecord | null;
  toast: ToastMessage | null;
  filters: {
    search: string;
    date: string;
    consultant: string;
    anesthesia_type: string;
  };
  setSelectedRecord: (record: OTRecord | null) => void;
  showToast: (type: ToastType, message: string) => void;
  clearToast: () => void;
  setFilter: (key: keyof UiState['filters'], value: string) => void;
  clearFilters: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedRecord: null,
  toast: null,
  filters: {
    search: '',
    date: '',
    consultant: '',
    anesthesia_type: ''
  },
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  showToast: (type, message) => set({ 
    toast: { 
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11), 
      type, 
      message 
    } 
  }),
  clearToast: () => set({ toast: null }),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilters: () => set({ filters: { search: '', date: '', consultant: '', anesthesia_type: '' } })
}));
