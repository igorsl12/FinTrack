import { AlertTriangle, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, getMonthLabel } from '@/shared/utils/date';
import type { ForecastSummary } from '../utils/forecast';

interface ForecastHeroProps {
  summary: ForecastSummary;
}

export function ForecastHero({ summary }: ForecastHeroProps) {
  const isPositive = summary.endOfMonthBalance >= 0;
  const NetIcon = summary.netRemaining >= 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className={[
        'rounded-3xl p-5 text-white relative overflow-hidden shadow-lg',
        isPositive
          ? 'bg-gradient-to-br from-income to-income-dark'
          : 'bg-gradient-to-br from-expense to-expense-dark',
      ].join(' ')}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-12 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-white/80">
            Saldo final · {getMonthLabel(summary.monthKey)}
          </p>
          <span className="badge bg-white/20 text-white text-[10px] flex items-center gap-1">
            <CalendarDays size={12} />
            até {formatDate(summary.endOfMonth)}
          </span>
        </div>

        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {formatCurrency(summary.endOfMonthBalance)}
        </p>
        <p className="mt-1 text-xs text-white/85">
          A partir do saldo atual de {formatCurrency(summary.currentBalance)}
          {summary.netRemaining !== 0 && (
            <>
              , {summary.netRemaining > 0 ? 'somam' : 'somem'}{' '}
              {formatCurrency(Math.abs(summary.netRemaining))} até o fim do mês
            </>
          )}
          .
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Pill
            label="Mais baixo"
            value={formatCurrency(summary.lowestBalance)}
            hint={formatDate(summary.lowestBalanceDate)}
            icon={
              summary.lowestBalance < 0 ? (
                <AlertTriangle size={14} />
              ) : (
                <TrendingDown size={14} />
              )
            }
          />
          <Pill
            label="Variação"
            value={formatCurrency(summary.netRemaining)}
            hint="hoje → fim do mês"
            icon={<NetIcon size={14} />}
          />
        </div>
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/80">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-white/70 mt-0.5">{hint}</p>
    </div>
  );
}
