import { useMemo, useState } from 'react';
import { Layout } from '@/shared/components/Layout';
import { PeriodFilter } from '@/shared/components/PeriodFilter';
import { BalanceHero } from '@/features/dashboard/components/BalanceHero';
import { SpendingHealth } from '@/features/dashboard/components/SpendingHealth';
import { FlowChart } from '@/features/dashboard/components/FlowChart';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions';
import { EmptyDashboard } from '@/features/dashboard/components/EmptyDashboard';
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BudgetProgressCard } from '@/features/budget/components/BudgetProgressCard';
import { useBudgetProgress } from '@/features/budget/hooks/useBudgetProgress';
import { InstallPrompt } from '@/shared/components/InstallPrompt';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { getCurrentMonthKey, getMonthLabel } from '@/shared/utils/date';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const { availableMonths } = useTransactions();

  // The dashboard is a month-at-a-glance view: only the month is selectable.
  // Multi-month ranges and category drill-down live on the Report page.
  const [month, setMonth] = useState<string>(getCurrentMonthKey());

  const selection = useMemo(
    () => ({ period: 'month' as const, month }),
    [month],
  );

  const m = useDashboardMetrics(selection);
  const budgetProgress = useBudgetProgress();
  const firstName = currentUser?.name.split(' ')[0] ?? '';

  return (
    <Layout subtitle={m.periodLabel} title={`Olá, ${firstName} `}>
      <div className="space-y-4">
        <InstallPrompt />

        <PeriodFilter
          period="month"
          month={month}
          availableMonths={availableMonths}
          resultLabel={getMonthLabel(month)}
          showPeriodOptions={false}
          showCategoryFilter={false}
          monthPicker="chips"
          onMonthChange={setMonth}
        />

        <BalanceHero
          monthLabel={m.periodLabel}
          balance={m.balance}
          income={m.totalIncome}
          expenses={m.totalExpenses}
          balanceDelta={m.balanceDelta}
        />

        {!m.hasData ? (
          <EmptyDashboard />
        ) : (
          <>
            <SpendingHealth rate={m.spendingRate} status={m.health} />
            <BudgetProgressCard items={budgetProgress} />

            <FlowChart data={m.monthlyFlow} />
            <CategoryBreakdown
              totalsByCategory={m.expenseByCategory}
              total={m.totalExpenses}
            />
            <RecentTransactions transactions={m.recentTransactions} />
          </>
        )}
      </div>
    </Layout>
  );
}
