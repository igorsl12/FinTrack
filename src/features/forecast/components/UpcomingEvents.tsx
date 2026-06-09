import { ArrowDownLeft, ArrowUpRight, CalendarDays } from 'lucide-react';
import type { ForecastEvent } from '../utils/forecast';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';

interface UpcomingEventsProps {
  events: ForecastEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Próximos eventos
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Nenhuma recorrência prevista pelo restante do mês.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Próximos eventos
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Recorrências que ainda vão acontecer este mês
        </p>
      </div>
      <ul className="space-y-2">
        {events.map((ev, idx) => {
          const isIncome = ev.type === 'income';
          return (
            <li key={`${ev.date}-${idx}`} className="flex items-center gap-3">
              <div
                className={[
                  'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                  isIncome
                    ? 'bg-income-light text-income-dark'
                    : 'bg-expense-light text-expense-dark',
                ].join(' ')}
              >
                {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {ev.description}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CalendarDays size={10} />
                  {formatDate(ev.date)} · {ev.category}
                </p>
              </div>
              <p
                className={[
                  'text-sm font-semibold whitespace-nowrap',
                  isIncome ? 'text-income-dark' : 'text-expense-dark',
                ].join(' ')}
              >
                {isIncome ? '+' : '-'} {formatCurrency(ev.amount)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
