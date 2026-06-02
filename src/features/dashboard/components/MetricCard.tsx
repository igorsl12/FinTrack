import type { LucideIcon } from 'lucide-react';

type MetricColor = 'default' | 'green' | 'red' | 'blue';

interface MetricCardProps {
  label: string;
  value: string;
  color?: MetricColor;
  icon?: LucideIcon;
  hint?: string;
}

const palette: Record<MetricColor, { bg: string; text: string; icon: string }> = {
  default: { bg: 'bg-white', text: 'text-slate-900', icon: 'text-slate-500' },
  green: { bg: 'bg-income-light', text: 'text-income-dark', icon: 'text-income-dark' },
  red: { bg: 'bg-expense-light', text: 'text-expense-dark', icon: 'text-expense-dark' },
  blue: { bg: 'bg-balance-light', text: 'text-balance-dark', icon: 'text-balance-dark' },
};

export function MetricCard({
  label,
  value,
  color = 'default',
  icon: Icon,
  hint,
}: MetricCardProps) {
  const p = palette[color];
  return (
    <div className={`card p-4 ${p.bg}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium uppercase tracking-wide ${p.text} opacity-70`}>
          {label}
        </p>
        {Icon && <Icon size={18} className={p.icon} />}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${p.text}`}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${p.text} opacity-70`}>{hint}</p>}
    </div>
  );
}
