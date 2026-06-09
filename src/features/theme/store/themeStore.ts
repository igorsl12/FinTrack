import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createZustandStorage, webStorage } from '@/shared/lib/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  setPreference(pref: ThemePreference): void;
}

export const THEME_STORAGE_KEY = 'fintrack:theme';

/**
 * Theme preference store. Side effects (mutating the `dark` class on the
 * document, listening to system theme changes) live outside the store so
 * the only job here is "remember the user's choice".
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        set({ preference });
        // Apply immediately so the change is reflected on the DOM even if
        // React effects are deferred (StrictMode double-invocation, etc.).
        applyTheme(preference);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => createZustandStorage(webStorage)),
    },
  ),
);

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolves a preference into a concrete light/dark choice and toggles the
 * `dark` class on `<html>`. Called by the React effect in App and by the
 * pre-render bootstrap.
 */
export function applyTheme(preference: ThemePreference): void {
  const wantsDark =
    preference === 'dark' || (preference === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', wantsDark);
}

/**
 * Reads the persisted preference from storage and applies it synchronously
 * before React renders. Used by main.tsx and by the inline script in
 * index.html to avoid a flash of the wrong theme.
 */
export function bootstrapTheme(): void {
  let preference: ThemePreference = 'system';
  try {
    const raw = webStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { preference?: ThemePreference } };
      if (parsed.state?.preference) preference = parsed.state.preference;
    }
  } catch {
    // ignore — use default
  }
  applyTheme(preference);
}
