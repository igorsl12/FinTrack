import { CalendarDays, Coins, Percent, Trash2, Target } from 'lucide-react';
import type { PlanRecord } from '@/shared/db/database';
import { simulate } from '../utils/simulate';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';

interface PlanCardProps {
  plan: PlanRecord;
  onDelete: (id: string) => void;
  onUse: (plan: PlanRecord) => void;
}

export function PlanCard({ plan, onDelete, onUse }: PlanCardProps) {
  const result = simulate({
    initialAmount: plan.initialAmount,
    monthlyContribution: plan.monthlyContribution,
    monthlyRate: plan.monthlyRate,
    months: plan.months,
  });
  const years = (plan.months / 12).toFixed(plan.months % 12 === 0 ? 0 : 1);
  const reachesTarget =
    plan.targetAmount != null && result.finalValue >= plan.targetAmount;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onUse(plan)}
          className="text-left flex-1 min-w-0"
        >
          <p className="text-sm font-semibold text-slate-900 truncate">
            {plan.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Toque para carregar no simulador
          </p>
        </button>
        <button
          type="button"
          onClick={() => onDelete(plan.id)}
          aria-label="Excluir plano"
          className="text-slate-400 hover:text-expense transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Stat
          icon={<Coins size={12} />}
          label="Aporte/mês"
          value={formatCurrency(plan.monthlyContribution)}
        />
        <Stat
          icon={<Percent size={12} />}
          label="Taxa/mês"
          value={formatPercent(plan.monthlyRate * 100, 2)}
        />
        <Stat
          icon={<CalendarDays size={12} />}
          label="Prazo"
          value={`${years} ${years === '1' ? 'ano' : 'anos'}`}
        />
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          Valor projetado
        </p>
        <p className="text-base font-semibold text-balance-dark">
          {formatCurrency(result.finalValue)}
        </p>
        {plan.targetAmount != null && (
          <p
            className={[
              'mt-1 text-[11px] flex items-center gap-1',
              reachesTarget ? 'text-income-dark' : 'text-warning-dark',
            ].join(' ')}
          >
            <Target size={12} />
            Meta: {formatCurrency(plan.targetAmount)} {reachesTarget ? '✓' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2">
      <p className="flex items-center gap-1 text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-800 truncate">
        {value}
      </p>
    </div>
  );
}
