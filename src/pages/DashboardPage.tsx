import { Layout } from '@/shared/components/Layout';
import { BalanceHero } from '@/features/dashboard/components/BalanceHero';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
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

export function DashboardPage() {
  const m = useDashboardMetrics();
  const { currentUser } = useAuth();
  const firstName = currentUser?.name.split(' ')[0] ?? '';
  const budgetProgress = useBudgetProgress();

  return (
    <Layout subtitle={m.monthLabel} title={`Olá, ${firstName} `}>
      <div className="space-y-4">
        <InstallPrompt />

        <BalanceHero
          monthLabel={m.monthLabel}
          balance={m.balance}
          income={m.totalIncome}
          expenses={m.totalExpenses}
          balanceDelta={m.balanceDelta}
        />

        <QuickActions />

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
