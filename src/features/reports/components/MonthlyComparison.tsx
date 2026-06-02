import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';
import { getMonthLabel } from '@/shared/utils/date';

interface MonthlyComparisonProps {
  currentMonth: string;
  previousMonth: string;
  current: { income: number; expenses: number; balance: number };
  previous: { income: number; expenses: number; balance: number };
}

function delta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function MonthlyComparison({
  currentMonth,
  previousMonth,
  current,
  previous,
}: MonthlyComparisonProps) {
  const rows = [
    { label: 'Receitas', cur: current.income, prev: previous.income, positiveIsGood: true },
    { label: 'Despesas', cur: current.expenses, prev: previous.expenses, positiveIsGood: false },
    { label: 'Saldo', cur: current.balance, prev: previous.balance, positiveIsGood: true },
  ];

  return (
    <div className="card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Comparativo mensal
        </h3>
        <p className="text-xs text-slate-500">
          {getMonthLabel(previousMonth)} vs {getMonthLabel(currentMonth)}
        </p>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => {
          const d = delta(r.cur, r.prev);
          const isFlat = Math.abs(d) < 0.5;
          const isGood = isFlat
            ? true
            : r.positiveIsGood
              ? d > 0
              : d < 0;
          const Icon = isFlat ? Minus : d > 0 ? TrendingUp : TrendingDown;
          const color = isFlat
            ? 'text-slate-500'
            : isGood
              ? 'text-income-dark'
              : 'text-expense-dark';
          return (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-medium">
                  {formatCurrency(r.cur)}
                </span>
                <span className={`flex items-center gap-1 text-xs ${color}`}>
                  <Icon size={14} />
                  {formatPercent(Math.abs(d), 0)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
