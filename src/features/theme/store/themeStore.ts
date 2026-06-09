import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createZustandStorage, webStorage } from '@/shared/lib/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  setPreference(pref: ThemePreference): void;
}

const STORAGE_KEY = 'fintrack:theme';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        set({ preference });
        applyTheme(preference);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => createZustandStorage(webStorage)),
    },
  ),
);

/**
 * Computes whether dark mode should be active given a preference and the
 * current system setting, then toggles the `dark` class on `<html>`.
 *
 * Called from three places:
 *   1. `bootstrapTheme()` at startup, before React renders (avoids FOUC)
 *   2. `setPreference()` whenever the user changes the choice
 *   3. The system-theme listener installed in `installThemeWatcher()`
 */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;
  const wantsDark =
    preference === 'dark' || (preference === 'system' && systemPrefersDark);
  root.classList.toggle('dark', wantsDark);
}

/** Reads the persisted preference (or defaults to 'system') and applies it. */
export function bootstrapTheme(): void {
  let preference: ThemePreference = 'system';
  try {
    const raw = webStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { preference?: ThemePreference } };
      if (parsed.state?.preference) preference = parsed.state.preference;
    }
  } catch {
    // ignore — use default
  }
  applyTheme(preference);
}

/**
 * Listens to system color-scheme changes and re-applies the theme when the
 * user is on `system` preference. Returns a cleanup function.
 */
export function installThemeWatcher(): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const pref = useThemeStore.getState().preference;
    if (pref === 'system') applyTheme('system');
  };
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}
