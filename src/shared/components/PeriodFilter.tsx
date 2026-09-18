import { useId, useMemo, useState } from 'react';
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { CategoryEntry } from '@/features/categories/hooks/useCategories';
import type { Category } from '@/features/transactions/types';
import {
  DEFAULT_PERIOD,
  PERIOD_OPTIONS,
  periodShortLabel,
  type Period,
} from '@/features/transactions/utils/period';
import { getCurrentMonthKey, getMonthLabel } from '@/shared/utils/date';

const selectClass =
  'h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs text-slate-700 outline-none transition-colors focus:border-balance focus:ring-2 focus:ring-balance/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const fieldLabelClass =
  'mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500';

interface PeriodFilterProps {
  period: Period;
  month: string;
  availableMonths: string[];
  /** Required only when `showCategoryFilter` is on. */
  category?: Category | '';
  incomeCategories?: CategoryEntry[];
  expenseCategories?: CategoryEntry[];
  /** Human-readable description of what is currently being shown. */
  resultLabel: string;
  /** Show the period presets (3/6/12 months, all). Off = month picker only. */
  showPeriodOptions?: boolean;
  /** Show the category picker. */
  showCategoryFilter?: boolean;
  /**
   * How to pick the month. `chips` shows every month as a tappable pill
   * (one tap instead of open-dropdown-then-tap); `select` keeps the compact
   * dropdown, which fits when it shares a row with the category field.
   */
  monthPicker?: 'chips' | 'select';
  onMonthChange: (month: string) => void;
  /** Required only when `showPeriodOptions` is on. */
  onPeriodChange?: (period: Period) => void;
  /** Required only when `showCategoryFilter` is on. */
  onCategoryChange?: (category: Category | '') => void;
}

/**
 * Collapsed-by-default filter bar, shared by the Dashboard and the Report.
 *
 * The controls stay tucked away so the data itself is what the user sees
 * first; the closed header still spells out the active selection, so nothing
 * is filtering silently behind a chevron.
 */
export function PeriodFilter({
  period,
  month,
  availableMonths,
  category = '',
  incomeCategories = [],
  expenseCategories = [],
  resultLabel,
  showPeriodOptions = true,
  showCategoryFilter = true,
  monthPicker = 'select',
  onPeriodChange,
  onMonthChange,
  onCategoryChange,
}: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const showMonthPicker = period === 'month';
  const currentMonth = getCurrentMonthKey();

  // The current month must always be offered, even with no transactions in
  // it yet — otherwise there is no way back to "now" after browsing.
  const monthOptions = useMemo(() => {
    const set = new Set(availableMonths);
    set.add(currentMonth);
    if (month) set.add(month);
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [availableMonths, currentMonth, month]);

  const isDefault =
    period === DEFAULT_PERIOD &&
    !category &&
    (!showMonthPicker || month === currentMonth);

  const periodSummary = showMonthPicker
    ? getMonthLabel(month || currentMonth)
    : periodShortLabel(period);

  function reset() {
    if (showPeriodOptions) onPeriodChange?.(DEFAULT_PERIOD);
    onMonthChange(currentMonth);
    if (showCategoryFilter) onCategoryChange?.('');
  }

  const showMonthChips = showMonthPicker && monthPicker === 'chips';
  const showMonthSelect = showMonthPicker && monthPicker === 'select';

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-balance-light text-balance dark:bg-slate-800 dark:text-balance-light">
            <SlidersHorizontal size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Filtros
            </span>
            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {periodSummary}
              {category && (
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  {' · '}
                  {category}
                </span>
              )}
            </span>
          </span>
          <ChevronDown
            size={18}
            className={[
              'shrink-0 text-slate-400 transition-transform duration-200',
              open ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>

        {!isDefault && (
          <button
            type="button"
            onClick={reset}
            aria-label="Limpar filtros"
            title="Limpar filtros"
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {open && (
        <div
          id={panelId}
          className="filter-panel space-y-3 border-t border-slate-200/70 px-3 pb-3 pt-3 dark:border-slate-800"
        >
          {showPeriodOptions && (
            <PillRow label="Período">
              {PERIOD_OPTIONS.map((option) => (
                <Pill
                  key={option.value}
                  active={period === option.value}
                  onClick={() => onPeriodChange?.(option.value)}
                >
                  {option.label}
                </Pill>
              ))}
            </PillRow>
          )}

          {showMonthChips && (
            <PillRow label={showPeriodOptions ? 'Mês' : undefined}>
              {monthOptions.map((value) => (
                <Pill
                  key={value}
                  active={month === value}
                  onClick={() => onMonthChange(value)}
                >
                  {getMonthLabel(value)}
                </Pill>
              ))}
            </PillRow>
          )}

          {(showMonthSelect || showCategoryFilter) && (
            <div className="grid grid-cols-2 gap-2">
              {showMonthSelect && (
                <label
                  className={[
                    'relative block',
                    showCategoryFilter ? '' : 'col-span-2',
                  ].join(' ')}
                >
                  <span className={fieldLabelClass}>Mês</span>
                  <select
                    value={month}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className={selectClass}
                  >
                    {monthOptions.map((value) => (
                      <option key={value} value={value}>
                        {getMonthLabel(value)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className="pointer-events-none absolute bottom-3 right-2.5 text-slate-400"
                  />
                </label>
              )}

              {showCategoryFilter && (
                <label
                  className={[
                    'relative block',
                    showMonthSelect ? '' : 'col-span-2',
                  ].join(' ')}
                >
                  <span className={fieldLabelClass}>Categoria</span>
                  <select
                    value={category}
                    onChange={(e) =>
                      onCategoryChange?.(e.target.value as Category)
                    }
                    className={selectClass}
                  >
                    <option value="">Todas as categorias</option>
                    <optgroup label="Despesas">
                      {expenseCategories.map((c) => (
                        <option key={`e-${c.name}`} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Receitas">
                      {incomeCategories.map((c) => (
                        <option key={`i-${c.name}`} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className="pointer-events-none absolute bottom-3 right-2.5 text-slate-400"
                  />
                </label>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Exibindo: <strong>{resultLabel}</strong>
            {category && ` · ${category}`}
          </p>
        </div>
      )}
    </div>
  );
}

function PillRow({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && <span className={fieldLabelClass}>{label}</span>}
      <div className="flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 dark:bg-slate-800">
        {children}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
        active
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
