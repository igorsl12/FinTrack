import { Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useThemeStore,
  type ThemePreference,
} from '../store/themeStore';

interface Option {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}

const OPTIONS: Option[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            className={[
              'h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
              active
                ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
