import { formatCurrency, formatPercent } from '@/shared/utils/currency';

interface CategoryRankingProps {
  ranking: Array<{ name: string; value: number; pct: number }>;
}

export function CategoryRanking({ ranking }: CategoryRankingProps) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Ranking de despesas por categoria
      </h3>
      {ranking.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Sem despesas registradas no mês atual.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {ranking.map((item, index) => (
            <li key={item.name}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-700">
                  {index + 1}. {item.name}
                </span>
                <span className="text-slate-500">
                  {formatCurrency(item.value)} · {formatPercent(item.pct)}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-balance"
                  style={{ width: `${Math.min(100, item.pct)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
