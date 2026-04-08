import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeMode: 'light',
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleThemeMode: () => {
        const nextMode = get().themeMode === 'dark' ? 'light' : 'dark';
        set({ themeMode: nextMode });
      },
    }),
    {
      name: 'codeforge-theme-store',
    },
  ),
);
