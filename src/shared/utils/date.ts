import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Formats `YYYY-MM-DD` (or full ISO) as e.g. `15 jun. 2024`. */
export function formatDate(date: string): string {
  const parsed = date.length === 10 ? parseISO(`${date}T00:00:00`) : parseISO(date);
  return format(parsed, "dd MMM. yyyy", { locale: ptBR });
}

/** Converts a `YYYY-MM` key to the short label `Jun/24`. */
export function getMonthLabel(month: string): string {
  const parsed = parseISO(`${month}-01T00:00:00`);
  const label = format(parsed, 'MMM/yy', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Current month in `YYYY-MM` form. */
export function getCurrentMonthKey(): string {
  return format(new Date(), 'yyyy-MM');
}

/** Extracts the `YYYY-MM` key from a `YYYY-MM-DD` date string. */
export function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

/** Today as `YYYY-MM-DD`. */
export function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Subtract `months` from current month and return `YYYY-MM`. */
export function offsetMonthKey(months: number, base = new Date()): string {
  const d = new Date(base.getFullYear(), base.getMonth() - months, 1);
  return format(d, 'yyyy-MM');
}
