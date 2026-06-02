import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/features/transactions/types';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Últimas transações
          </h3>
          <p className="text-xs text-slate-500">Os 5 lançamentos mais recentes</p>
        </div>
        <Link
          to="/history"
          className="text-xs font-medium text-balance hover:underline flex items-center gap-0.5"
        >
          Ver tudo
          <ChevronRight size={14} />
        </Link>
      </div>

      <ul className="space-y-2">
        {transactions.map((t) => {
          const isIncome = t.type === 'income';
          return (
            <li key={t.id} className="flex items-center gap-3">
              <div
                className={[
                  'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                  isIncome
                    ? 'bg-income-light text-income-dark'
                    : 'bg-expense-light text-expense-dark',
                ].join(' ')}
              >
                {isIncome ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownLeft size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {t.description}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatDate(t.date)} · {t.category}
                </p>
              </div>
              <p
                className={[
                  'text-sm font-semibold whitespace-nowrap',
                  isIncome ? 'text-income-dark' : 'text-expense-dark',
                ].join(' ')}
              >
                {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
