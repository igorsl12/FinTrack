import { AlertTriangle, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import type { HealthStatus } from '../hooks/useDashboardMetrics';
import { formatPercent } from '@/shared/utils/currency';

interface SpendingHealthProps {
  rate: number;
  status: HealthStatus;
}

const palette: Record<
  HealthStatus,
  {
    bg: string;
    text: string;
    bar: string;
    Icon: typeof ShieldCheck;
    label: string;
    hint: string;
  }
> = {
  healthy: {
    bg: 'bg-income-light',
    text: 'text-income-dark',
    bar: 'bg-income',
    Icon: ShieldCheck,
    label: 'Saudável',
    hint: 'Você está gastando menos de 70% das receitas. Continue assim!',
  },
  attention: {
    bg: 'bg-warning-light',
    text: 'text-warning-dark',
    bar: 'bg-warning',
    Icon: AlertTriangle,
    label: 'Atenção',
    hint: 'Suas despesas estão comprometendo boa parte das receitas.',
  },
  deficit: {
    bg: 'bg-expense-light',
    text: 'text-expense-dark',
    bar: 'bg-expense',
    Icon: TrendingDown,
    label: 'Déficit',
    hint: 'As despesas superaram as receitas. Vale revisar o que pode esperar.',
  },
  idle: {
    bg: 'bg-balance-light',
    text: 'text-balance-dark',
    bar: 'bg-balance',
    Icon: Sparkles,
    label: 'Sem dados ainda',
    hint: 'Registre seus primeiros lançamentos do mês.',
  },
};

export function SpendingHealth({ rate, status }: SpendingHealthProps) {
  const p = palette[status];
  const pct = Math.min(100, rate);

  return (
    <div className={`card p-4 ${p.bg}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-9 w-9 rounded-xl bg-white/70 flex items-center justify-center ${p.text}`}>
            <p.Icon size={18} />
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wide ${p.text} opacity-80`}>
              Saúde do mês
            </p>
            <p className={`text-sm font-semibold ${p.text}`}>{p.label}</p>
          </div>
        </div>
        {status !== 'idle' && (
          <div className="text-right">
            <p className={`text-[11px] ${p.text} opacity-80`}>Gastos / receitas</p>
            <p className={`text-base font-semibold ${p.text}`}>
              {formatPercent(rate, 0)}
            </p>
          </div>
        )}
      </div>

      {status !== 'idle' && (
        <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
          <div
            className={`h-full rounded-full ${p.bar} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <p className={`mt-2.5 text-xs ${p.text} opacity-90 leading-relaxed`}>
        {p.hint}
      </p>
    </div>
  );
}
