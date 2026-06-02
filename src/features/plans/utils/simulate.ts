export interface SimulationInput {
  /** Starting amount (PV). */
  initialAmount: number;
  /** Recurring contribution applied at the end of every month (PMT). */
  monthlyContribution: number;
  /** Monthly interest rate as decimal (e.g. 0.01 for 1% per month). */
  monthlyRate: number;
  /** Number of months to simulate. */
  months: number;
}

export interface SimulationPoint {
  month: number;
  /** Months expressed as years for readable axis labels. */
  yearFraction: number;
  /** Balance at end of month, after interest and contribution. */
  balance: number;
  /** Cumulative amount the user put in (initial + sum of contributions). */
  contributions: number;
  /** Compounded interest gained so far (balance − contributions). */
  interest: number;
}

export interface SimulationResult {
  finalValue: number;
  totalContributions: number;
  totalInterest: number;
  series: SimulationPoint[];
  /** Effective annual rate equivalent to the monthlyRate (for display). */
  annualRate: number;
}

/**
 * Compound-interest projection with monthly contributions.
 *
 * Formula (end-of-period contributions):
 *   FV = PV·(1+r)^n + PMT·((1+r)^n − 1)/r
 *
 * Returns the full month-by-month series so the UI can chart growth and
 * the share between contributions and interest.
 */
export function simulate(input: SimulationInput): SimulationResult {
  const { initialAmount, monthlyContribution, monthlyRate, months } = input;
  const series: SimulationPoint[] = [];

  let balance = initialAmount;
  let contributions = initialAmount;

  // Month 0 (starting point) so the chart renders nicely from zero
  series.push({
    month: 0,
    yearFraction: 0,
    balance,
    contributions,
    interest: 0,
  });

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    contributions += monthlyContribution;
    series.push({
      month: m,
      yearFraction: m / 12,
      balance,
      contributions,
      interest: balance - contributions,
    });
  }

  return {
    finalValue: balance,
    totalContributions: contributions,
    totalInterest: balance - contributions,
    series,
    annualRate: Math.pow(1 + monthlyRate, 12) - 1,
  };
}

/**
 * Solves for the monthly contribution needed to reach a target value.
 * Returns null if not solvable (e.g. target already covered by the
 * initial amount + interest alone, or zero months).
 */
export function solveForContribution(input: {
  initialAmount: number;
  monthlyRate: number;
  months: number;
  targetAmount: number;
}): number | null {
  const { initialAmount, monthlyRate, months, targetAmount } = input;
  if (months <= 0) return null;

  const growthFactor = Math.pow(1 + monthlyRate, months);
  const fvOfPv = initialAmount * growthFactor;
  const remaining = targetAmount - fvOfPv;
  if (remaining <= 0) return 0;

  if (monthlyRate === 0) return remaining / months;

  const annuityFactor = (growthFactor - 1) / monthlyRate;
  return remaining / annuityFactor;
}

/** Solves for how many months are needed to reach the target value. */
export function solveForMonths(input: {
  initialAmount: number;
  monthlyContribution: number;
  monthlyRate: number;
  targetAmount: number;
}): number | null {
  const { initialAmount, monthlyContribution, monthlyRate, targetAmount } = input;
  if (targetAmount <= initialAmount) return 0;
  if (monthlyContribution <= 0 && monthlyRate <= 0) return null;

  if (monthlyRate === 0) {
    return Math.ceil((targetAmount - initialAmount) / monthlyContribution);
  }

  const num = targetAmount * monthlyRate + monthlyContribution;
  const den = initialAmount * monthlyRate + monthlyContribution;
  if (den <= 0 || num / den <= 0) return null;
  const months = Math.log(num / den) / Math.log(1 + monthlyRate);
  if (!Number.isFinite(months) || months <= 0) return null;
  return Math.ceil(months);
}

/** Annual rate → equivalent monthly rate (compound). */
export function annualToMonthly(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}
