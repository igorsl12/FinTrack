import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ForecastDay } from '../utils/forecast';
import { formatCurrency } from '@/shared/utils/currency';

interface ForecastChartProps {
  series: ForecastDay[];
  todayLabel?: string;
}

export function ForecastChart({ series, todayLabel }: ForecastChartProps) {
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Saldo dia-a-dia
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <Legend dot="bg-balance" label="Real" />
          <Legend dot="bg-balance/40" label="Projetado" />
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Histórico até hoje + projeção das recorrências
      </p>

      <div className="h-56 -mx-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#378ADD" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#378ADD" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="dayOfMonth"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(1, Math.floor(series.length / 6))}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1000
                  ? `${(v / 1000).toFixed(0)}k`
                  : String(Math.round(v))
              }
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(day: number) => `Dia ${day}`}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                padding: '8px 10px',
              }}
            />
            <ReferenceLine y={0} stroke="#e24b4a" strokeDasharray="4 4" />
            {todayLabel && (
              <ReferenceLine
                x={Number(todayLabel.split('-')[2])}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: 'hoje',
                  position: 'top',
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey={(d: ForecastDay) => (d.isPast || d.isToday ? d.balance : null)}
              name="Real"
              stroke="#378ADD"
              strokeWidth={2.5}
              fill="url(#forecastFill)"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey={(d: ForecastDay) =>
                d.isPast ? null : d.balance
              }
              name="Projetado"
              stroke="#378ADD"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
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
