import { useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Sparkles, X } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { Button } from '@/shared/components/Button';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { HealthBadge } from '@/features/reports/components/HealthBadge';
import { CategoryRanking } from '@/features/reports/components/CategoryRanking';
import { MonthlyComparison } from '@/features/reports/components/MonthlyComparison';
import { PeriodFilter } from '@/shared/components/PeriodFilter';
import {
  useReportData,
  type ReportPeriod,
} from '@/features/reports/hooks/useReportData';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { type Category } from '@/features/transactions/types';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';
import { getCurrentMonthKey } from '@/shared/utils/date';

const PIE_COLORS = [
  '#E24B4A',
  '#EF9F27',
  '#378ADD',
  '#639922',
  '#A855F7',
  '#0EA5E9',
  '#F472B6',
];

export function ReportPage() {
  const { availableMonths } = useTransactions();
  const categories = useCategories();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [month, setMonth] = useState<string>(getCurrentMonthKey());
  const [category, setCategory] = useState<Category | ''>('');
  const [showInsights, setShowInsights] = useState(false);

  const filters = useMemo(
    () => ({
      period,
      month: period === 'month' ? month : undefined,
      category: category || undefined,
    }),
    [period, month, category],
  );

  const r = useReportData(filters);

  const pieData = r.ranking.map((item) => ({
    name: item.name,
    value: Number(item.value.toFixed(2)),
  }));

  return (
    <Layout subtitle="Análises" title="Relatório">
      <div className="space-y-4">
        <PeriodFilter
          period={period}
          month={month}
          category={category}
          availableMonths={availableMonths}
          incomeCategories={categories.income}
          expenseCategories={categories.expense}
          resultLabel={r.label}
          onPeriodChange={setPeriod}
          onMonthChange={setMonth}
          onCategoryChange={setCategory}
        />

        <HealthBadge status={r.health} />

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Receitas"
            value={formatCurrency(r.income)}
            color="green"
          />
          <MetricCard
            label="Despesas"
            value={formatCurrency(r.expenses)}
            color="red"
          />
          <MetricCard
            label="Saldo"
            value={formatCurrency(r.balance)}
            color={r.balance >= 0 ? 'blue' : 'red'}
          />
          <MetricCard
            label="Taxa de gastos"
            value={formatPercent(r.spendRate, 0)}
            color={r.spendRate < 70 ? 'green' : r.spendRate < 100 ? 'default' : 'red'}
          />
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Distribuição de despesas
          </h3>
          {pieData.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Sem despesas no período para gerar o gráfico.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <CategoryRanking ranking={r.ranking} />

        {r.isSingleMonth && r.previousMonth && (
          <MonthlyComparison
            currentMonth={r.currentMonth}
            previousMonth={r.previousMonth}
            current={{
              income: r.income,
              expenses: r.expenses,
              balance: r.balance,
            }}
            previous={r.previous}
          />
        )}

        <Button
          variant="primary"
          size="lg"
          icon={Sparkles}
          className="w-full"
          onClick={() => setShowInsights(true)}
        >
          Ver análise completa
        </Button>
      </div>

      {showInsights && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 px-4 pb-24 sm:pb-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-warning" />
                Insights — {r.label}
              </h2>
              <button
                type="button"
                onClick={() => setShowInsights(false)}
                aria-label="Fechar"
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              {r.insights.message}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <Stat
                label="Taxa de poupança"
                value={formatPercent(r.insights.savingsRate, 0)}
              />
              {r.isSingleMonth && (
                <Stat
                  label="Variação do saldo"
                  value={formatPercent(r.insights.monthOverMonthDelta, 0)}
                />
              )}
              {r.insights.topCategory && (
                <Stat
                  label="Categoria líder"
                  value={`${r.insights.topCategory.name} · ${formatPercent(r.insights.topCategory.pct, 0)}`}
                />
              )}
              {r.isSingleMonth && (
                <Stat
                  label="Variação despesas"
                  value={formatPercent(r.insights.expenseChange, 0)}
                />
              )}
            </dl>
            <Button
              variant="secondary"
              className="w-full mt-5"
              onClick={() => setShowInsights(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-100 p-3">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
