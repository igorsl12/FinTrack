import { ShieldCheck, AlertTriangle, TrendingDown } from 'lucide-react';
import type { HealthStatus } from '../hooks/useReportData';

interface HealthBadgeProps {
  status: HealthStatus;
}

const styles: Record<HealthStatus, { bg: string; text: string; label: string; Icon: typeof ShieldCheck }> = {
  healthy: {
    bg: 'bg-income-light',
    text: 'text-income-dark',
    label: 'Saudável',
    Icon: ShieldCheck,
  },
  attention: {
    bg: 'bg-warning-light',
    text: 'text-warning-dark',
    label: 'Atenção',
    Icon: AlertTriangle,
  },
  deficit: {
    bg: 'bg-expense-light',
    text: 'text-expense-dark',
    label: 'Déficit',
    Icon: TrendingDown,
  },
};

const descriptions: Record<HealthStatus, string> = {
  healthy: 'Saldo positivo e taxa de gastos abaixo de 70%.',
  attention: 'Saldo positivo, mas gastos próximos do limite das receitas.',
  deficit: 'As despesas estão superando as receitas no mês.',
};

export function HealthBadge({ status }: HealthBadgeProps) {
  const s = styles[status];
  return (
    <div className={`card p-4 ${s.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-white/70 ${s.text}`}>
          <s.Icon size={22} />
        </div>
        <div>
          <p className={`text-xs uppercase tracking-wide ${s.text} opacity-80`}>
            Saúde financeira
          </p>
          <p className={`text-lg font-semibold ${s.text}`}>{s.label}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm ${s.text} opacity-90`}>{descriptions[status]}</p>
    </div>
  );
}
