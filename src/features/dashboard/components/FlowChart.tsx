import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyData } from '@/features/transactions/types';
import { formatCurrency } from '@/shared/utils/currency';

interface FlowChartProps {
  data: MonthlyData[];
}

export function FlowChart({ data }: FlowChartProps) {
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-800">
          Fluxo do semestre
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <Legend dot="bg-income" label="Receitas" />
          <Legend dot="bg-expense" label="Despesas" />
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">Últimos 6 meses</p>

      <div className="h-44 -mx-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#639922" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#639922" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E24B4A" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#E24B4A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                padding: '8px 10px',
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Receitas"
              stroke="#639922"
              strokeWidth={2}
              fill="url(#incomeFill)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Despesas"
              stroke="#E24B4A"
              strokeWidth={2}
              fill="url(#expenseFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
