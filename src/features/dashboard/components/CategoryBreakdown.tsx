import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';

interface CategoryBreakdownProps {
  totalsByCategory: Record<string, number>;
  total: number;
  topN?: number;
}

const BAR_COLORS = [
  'bg-expense',
  'bg-warning',
  'bg-balance',
  'bg-income',
  'bg-slate-400',
];

export function CategoryBreakdown({
  totalsByCategory,
  total,
  topN = 4,
}: CategoryBreakdownProps) {
  const sorted = Object.entries(totalsByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);

  if (sorted.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Onde seu dinheiro foi
          </h3>
          <p className="text-xs text-slate-500">
            Top {sorted.length} categorias do mês
          </p>
        </div>
        <Link
          to="/report"
          className="text-xs font-medium text-balance hover:underline flex items-center gap-0.5"
        >
          Detalhes
          <ChevronRight size={14} />
        </Link>
      </div>

      <ul className="space-y-3">
        {sorted.map(([category, value], i) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <li key={category}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-700">{category}</span>
                <div className="flex items-baseline gap-2 text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(value)}
                  </span>
                  <span className="tabular-nums">{formatPercent(pct, 0)}</span>
                </div>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
