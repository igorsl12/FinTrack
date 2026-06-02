import { Link } from 'react-router-dom';
import { ChevronRight, Target } from 'lucide-react';
import type { BudgetProgressItem } from '../hooks/useBudgetProgress';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';

interface BudgetProgressCardProps {
  items: BudgetProgressItem[];
  topN?: number;
}

const STATUS_BAR: Record<BudgetProgressItem['status'], string> = {
  ok: 'bg-income',
  warning: 'bg-warning',
  over: 'bg-expense',
};

const STATUS_TEXT: Record<BudgetProgressItem['status'], string> = {
  ok: 'text-income-dark',
  warning: 'text-warning-dark',
  over: 'text-expense-dark',
};

export function BudgetProgressCard({
  items,
  topN = 4,
}: BudgetProgressCardProps) {
  if (items.length === 0) {
    return (
      <Link
        to="/budget"
        className="card p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        <div className="h-10 w-10 rounded-xl bg-balance-light text-balance-dark flex items-center justify-center">
          <Target size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            Defina um orçamento
          </p>
          <p className="text-xs text-slate-500">
            Estabeleça limites mensais por categoria
          </p>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </Link>
    );
  }

  const visible = items.slice(0, topN);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Orçamento do mês</h3>
          <p className="text-xs text-slate-500">
            {visible.length} de {items.length} categorias
          </p>
        </div>
        <Link
          to="/budget"
          className="text-xs font-medium text-balance hover:underline flex items-center gap-0.5"
        >
          Gerenciar
          <ChevronRight size={14} />
        </Link>
      </div>

      <ul className="space-y-3">
        {visible.map((item) => {
          const remaining = item.limit - item.spent;
          return (
            <li key={item.budgetId}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-700">
                  {item.category}
                </span>
                <span className={STATUS_TEXT[item.status]}>
                  {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${STATUS_BAR[item.status]} transition-all`}
                  style={{ width: `${Math.min(100, item.rate)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>{formatPercent(item.rate, 0)} usado</span>
                <span>
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} restante`
                    : `${formatCurrency(-remaining)} acima`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
