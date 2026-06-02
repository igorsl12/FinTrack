import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  PieChart,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const items: NavItem[] = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/add', label: 'Lançar', icon: PlusCircle },
  { to: '/history', label: 'Extrato', icon: ListChecks },
  { to: '/plans', label: 'Planos', icon: TrendingUp },
  { to: '/report', label: 'Relatório', icon: PieChart },
];

/**
 * Bottom tab navigation, modeled to be 1:1 portable to a React Navigation
 * Tab Navigator on React Native (each item maps to a screen).
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] z-30 bg-white border-t border-slate-200 shadow-app safe-area"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors',
                  isActive
                    ? 'text-balance font-semibold'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
