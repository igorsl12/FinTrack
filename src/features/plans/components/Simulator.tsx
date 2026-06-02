import { useMemo } from 'react';
import { Bookmark, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { ProjectionChart } from './ProjectionChart';
import {
  simulate,
  solveForContribution,
  solveForMonths,
} from '../utils/simulate';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';

export interface SimulatorState {
  initialAmount: number;
  monthlyContribution: number;
  monthlyRate: number;
  months: number;
  targetAmount: number | null;
}

interface RatePreset {
  label: string;
  monthly: number;
  description: string;
}

const RATE_PRESETS: RatePreset[] = [
  { label: 'Poupança', monthly: 0.005, description: '~0,5% / mês' },
  { label: 'CDI', monthly: 0.0095, description: '~0,95% / mês' },
  { label: 'Tesouro IPCA+', monthly: 0.0075, description: '~0,75% / mês' },
  { label: 'Ações (média)', monthly: 0.011, description: '~1,1% / mês' },
];

const PERIOD_PRESETS = [1, 3, 5, 10, 20, 30];

interface SimulatorProps {
  value: SimulatorState;
  onChange: (state: SimulatorState) => void;
  onSaveClick: () => void;
  averageMonthlySavings?: number;
}

export function Simulator({
  value,
  onChange,
  onSaveClick,
  averageMonthlySavings = 0,
}: SimulatorProps) {
  const result = useMemo(
    () =>
      simulate({
        initialAmount: value.initialAmount,
        monthlyContribution: value.monthlyContribution,
        monthlyRate: value.monthlyRate,
        months: value.months,
      }),
    [value],
  );

  function set<K extends keyof SimulatorState>(key: K, v: SimulatorState[K]) {
    onChange({ ...value, [key]: v });
  }

  const interestShare =
    result.finalValue > 0 ? (result.totalInterest / result.finalValue) * 100 : 0;

  const monthsForTarget =
    value.targetAmount != null
      ? solveForMonths({
          initialAmount: value.initialAmount,
          monthlyContribution: value.monthlyContribution,
          monthlyRate: value.monthlyRate,
          targetAmount: value.targetAmount,
        })
      : null;

  const contribForTarget =
    value.targetAmount != null
      ? solveForContribution({
          initialAmount: value.initialAmount,
          monthlyRate: value.monthlyRate,
          months: value.months,
          targetAmount: value.targetAmount,
        })
      : null;

  return (
    <div className="space-y-4">
      <ResultCard
        finalValue={result.finalValue}
        contributions={result.totalContributions}
        interest={result.totalInterest}
        interestShare={interestShare}
        annualRate={result.annualRate}
        months={value.months}
        onSaveClick={onSaveClick}
      />

      <ProjectionChart series={result.series} />

      <div className="card p-4 space-y-4">
        <NumberField
          label="Valor inicial"
          value={value.initialAmount}
          onChange={(v) => set('initialAmount', v)}
          step={100}
        />

        <div>
          <NumberField
            label="Aporte mensal"
            value={value.monthlyContribution}
            onChange={(v) => set('monthlyContribution', v)}
            step={50}
          />
          {averageMonthlySavings > 0 &&
            averageMonthlySavings !== value.monthlyContribution && (
              <button
                type="button"
                onClick={() => set('monthlyContribution', averageMonthlySavings)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-balance hover:underline"
              >
                <Sparkles size={11} />
                Usar minha média ({formatCurrency(averageMonthlySavings)} / mês)
              </button>
            )}
        </div>

        <div>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Taxa mensal
            </span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                step={0.05}
                min={0}
                value={(value.monthlyRate * 100).toFixed(2)}
                onChange={(e) =>
                  set(
                    'monthlyRate',
                    Math.max(0, Number(e.target.value) / 100),
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RATE_PRESETS.map((p) => {
              const active = Math.abs(value.monthlyRate - p.monthly) < 0.0001;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set('monthlyRate', p.monthly)}
                  className={[
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                    active
                      ? 'bg-balance text-white border-balance'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                  title={p.description}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Equivale a {formatPercent(result.annualRate * 100, 2)} ao ano
          </p>
        </div>

        <div>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Prazo (em anos)
            </span>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              max={50}
              value={Math.max(1, Math.round(value.months / 12))}
              onChange={(e) =>
                set('months', Math.max(1, Number(e.target.value)) * 12)
              }
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map((y) => {
              const active = value.months === y * 12;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => set('months', y * 12)}
                  className={[
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                    active
                      ? 'bg-balance text-white border-balance'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {y}a
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-balance" />
          <h3 className="text-sm font-semibold text-slate-800">
            Tem uma meta?
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Defina um valor alvo e o app calcula quanto tempo ou aporte é
          necessário.
        </p>
        <div className="flex items-center gap-2">
          <NumberField
            label="Valor da meta"
            value={value.targetAmount ?? 0}
            onChange={(v) => set('targetAmount', v > 0 ? v : null)}
            step={1000}
          />
        </div>

        {value.targetAmount != null && value.targetAmount > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <InsightTile
              label="Tempo necessário"
              value={
                monthsForTarget === null
                  ? '—'
                  : monthsForTarget === 0
                    ? 'já atingida'
                    : `${(monthsForTarget / 12).toFixed(1)} anos`
              }
              hint={`Mantendo ${formatCurrency(value.monthlyContribution)}/mês`}
            />
            <InsightTile
              label="Aporte necessário"
              value={
                contribForTarget === null
                  ? '—'
                  : contribForTarget <= 0
                    ? 'já atingida'
                    : `${formatCurrency(contribForTarget)}/mês`
              }
              hint={`Em ${(value.months / 12).toFixed(0)} anos`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  finalValue: number;
  contributions: number;
  interest: number;
  interestShare: number;
  annualRate: number;
  months: number;
  onSaveClick: () => void;
}

function ResultCard({
  finalValue,
  contributions,
  interest,
  interestShare,
  annualRate,
  months,
  onSaveClick,
}: ResultCardProps) {
  return (
    <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-balance to-balance-dark shadow-lg relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-white/80">
            Em {(months / 12).toFixed(months % 12 === 0 ? 0 : 1)} anos você terá
          </p>
          <span className="badge bg-white/20 text-white text-[10px] flex items-center gap-1">
            <TrendingUp size={11} />
            {formatPercent(annualRate * 100, 1)} a.a.
          </span>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {formatCurrency(finalValue)}
        </p>

        <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-income transition-all"
            style={{ width: `${Math.min(100, interestShare)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-white/85">
          <span>Aportes {formatCurrency(contributions)}</span>
          <span className="text-white">
            Juros {formatCurrency(interest)} ({interestShare.toFixed(0)}%)
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Bookmark}
          className="mt-4"
          onClick={onSaveClick}
        >
          Salvar como plano
        </Button>
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}

function NumberField({ label, value, onChange, step = 1 }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-sm text-slate-500">R$</span>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
        />
      </div>
    </label>
  );
}

function InsightTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
    </div>
  );
}
