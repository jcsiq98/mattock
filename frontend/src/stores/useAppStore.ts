import { create } from 'zustand';

interface AppState {
  // Online/offline status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Sync queue
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;
  incrementPendingSync: () => void;
  decrementPendingSync: () => void;

  // Inspector info (for quick access)
  inspectorName: string;
  setInspectorName: (name: string) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Online status - will be synced with navigator.onLine
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online }),

  // Sync queue count
  pendingSyncCount: 0,
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
  incrementPendingSync: () =>
    set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 })),
  decrementPendingSync: () =>
    set((state) => ({
      pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
    })),

  // Inspector name (persisted in localStorage)
  inspectorName: typeof localStorage !== 'undefined' 
    ? localStorage.getItem('inspectorName') || '' 
    : '',
  setInspectorName: (name) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inspectorName', name);
    }
    set({ inspectorName: name });
  },

  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setIsOnline(true);
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setIsOnline(false);
  });
}

