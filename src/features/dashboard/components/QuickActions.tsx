import { Link } from 'react-router-dom';
import { FileSpreadsheet, PieChart, PlusCircle, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Action {
  to: string;
  label: string;
  icon: LucideIcon;
  tone: 'primary' | 'soft';
}

const actions: Action[] = [
  { to: '/add', label: 'Lançar', icon: PlusCircle, tone: 'primary' },
  { to: '/import', label: 'Importar', icon: FileSpreadsheet, tone: 'soft' },
  { to: '/plans', label: 'Planos', icon: TrendingUp, tone: 'soft' },
  { to: '/report', label: 'Relatório', icon: PieChart, tone: 'soft' },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ to, label, icon: Icon, tone }) => (
        <Link
          key={to}
          to={to}
          className={[
            'flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-medium transition-all active:scale-95',
            tone === 'primary'
              ? 'bg-balance text-white shadow-sm hover:bg-balance-dark'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
          ].join(' ')}
        >
          <Icon size={20} strokeWidth={1.8} />
          {label}
        </Link>
      ))}
    </div>
  );
}
