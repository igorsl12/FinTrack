import { AlertTriangle, Sparkles } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { ForecastHero } from '@/features/forecast/components/ForecastHero';
import { ForecastChart } from '@/features/forecast/components/ForecastChart';
import { UpcomingEvents } from '@/features/forecast/components/UpcomingEvents';
import { useForecast } from '@/features/forecast/hooks/useForecast';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';

export function ForecastPage() {
  const summary = useForecast();

  const lowestBelowZero =
    summary.goesNegative && summary.firstNegativeDate != null;

  return (
    <Layout subtitle="Previsão" title="Fluxo de caixa">
      <div className="space-y-4">
        <ForecastHero summary={summary} />

        {lowestBelowZero && (
          <div className="card p-4 bg-expense-light text-expense-dark border-expense-light">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Saldo fica negativo</p>
                <p className="text-xs mt-0.5">
                  Pela projeção, no dia{' '}
                  <strong>{formatDate(summary.firstNegativeDate!)}</strong>{' '}
                  o saldo cai para{' '}
                  <strong>{formatCurrency(summary.lowestBalance)}</strong>.
                  Vale antecipar uma receita ou adiar despesas variáveis.
                </p>
              </div>
            </div>
          </div>
        )}

        {!lowestBelowZero && summary.endOfMonthBalance > summary.currentBalance && (
          <div className="card p-4 bg-income-light text-income-dark">
            <div className="flex items-start gap-2">
              <Sparkles size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Mês com sobra prevista</p>
                <p className="text-xs mt-0.5">
                  Mantendo o ritmo atual e as recorrências cadastradas, você
                  termina o mês com{' '}
                  <strong>{formatCurrency(summary.endOfMonthBalance)}</strong>{' '}
                  — uma folga de{' '}
                  <strong>{formatCurrency(summary.netRemaining)}</strong>{' '}
                  a partir de hoje.
                </p>
              </div>
            </div>
          </div>
        )}

        <ForecastChart series={summary.series} todayLabel={summary.today} />

        <UpcomingEvents events={summary.upcomingEvents} />
      </div>
    </Layout>
  );
}
