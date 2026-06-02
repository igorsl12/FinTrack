import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationPoint } from '../utils/simulate';
import { formatCurrency } from '@/shared/utils/currency';

interface ProjectionChartProps {
  series: SimulationPoint[];
}

export function ProjectionChart({ series }: ProjectionChartProps) {
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-800">
          Evolução projetada
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <Legend dot="bg-balance" label="Aportes" />
          <Legend dot="bg-income" label="Juros" />
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Composição do valor acumulado ao longo do tempo
      </p>

      <div className="h-56 -mx-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="contribFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#378ADD" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#378ADD" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="interestFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#639922" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#639922" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="yearFraction"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v === 0 ? 'hoje' : `${v.toFixed(0)}a`
              }
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={42}
              tickFormatter={(v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : String(Math.round(v))
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'contributions' ? 'Aportes' : 'Juros',
              ]}
              labelFormatter={(v: number) =>
                v === 0 ? 'Hoje' : `Mês ${v} · ${(v / 12).toFixed(1)}a`
              }
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                padding: '8px 10px',
              }}
            />
            <Area
              type="monotone"
              dataKey="contributions"
              stackId="1"
              stroke="#378ADD"
              strokeWidth={2}
              fill="url(#contribFill)"
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke="#639922"
              strokeWidth={2}
              fill="url(#interestFill)"
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
