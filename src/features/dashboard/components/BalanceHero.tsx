import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';

interface BalanceHeroProps {
  monthLabel: string;
  balance: number;
  income: number;
  expenses: number;
  balanceDelta: number | null;
}

export function BalanceHero({
  monthLabel,
  balance,
  income,
  expenses,
  balanceDelta,
}: BalanceHeroProps) {
  const isPositive = balance >= 0;

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
            Saldo · {monthLabel}
          </p>
          <DeltaPill delta={balanceDelta} />
        </div>

        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {formatCurrency(balance)}
        </p>
        <p className="mt-1 text-xs text-white/80">
          {isPositive
            ? 'Você está no azul este mês.'
            : 'Atenção: despesas acima das receitas.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Pill
            label="Receitas"
            value={formatCurrency(income)}
            icon={<ArrowUpRight size={14} />}
          />
          <Pill
            label="Despesas"
            value={formatCurrency(expenses)}
            icon={<ArrowDownLeft size={14} />}
          />
        </div>
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/80">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="badge bg-white/20 text-white/90 text-[10px]">
        sem mês anterior
      </span>
    );
  }
  const flat = Math.abs(delta) < 0.5;
  const Icon = flat ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  return (
    <span className="badge bg-white/20 text-white text-[10px] flex items-center gap-1">
      <Icon size={12} />
      {flat ? 'estável' : formatPercent(Math.abs(delta), 0)} vs mês anterior
    </span>
  );
}
