const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

/** Formats a number as Brazilian Real (e.g. `R$ 1.500,00`). */
export function formatCurrency(value: number): string {
  return formatter.format(value);
}

/**
 * Parses a string formatted as Brazilian currency back to a number.
 * Accepts inputs like `R$ 1.500,00`, `1.500,00`, `1500,00`, `1500.00`.
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Returns a formatted percentage like `42,5%`. */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}
