import { useEffect, useState } from 'react';
import { Layout } from '@/shared/components/Layout';
import { Simulator, type SimulatorState } from '@/features/plans/components/Simulator';
import { PlanCard } from '@/features/plans/components/PlanCard';
import { SavePlanDialog } from '@/features/plans/components/SavePlanDialog';
import { usePlansStore } from '@/features/plans/store/plansStore';
import { usePlanSuggestions } from '@/features/plans/hooks/usePlanSuggestions';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { PlanRecord } from '@/shared/db/database';

const DEFAULT_STATE: SimulatorState = {
  initialAmount: 1000,
  monthlyContribution: 500,
  monthlyRate: 0.0095, // CDI ~1% mensal
  months: 12 * 5,
  targetAmount: null,
};

export function PlansPage() {
  const currentUserId = useAuthStore((s) => s.currentUser?.id ?? null);
  const plans = usePlansStore((s) => s.plans);
  const userId = usePlansStore((s) => s.userId);
  const loadForUser = usePlansStore((s) => s.loadForUser);
  const createPlan = usePlansStore((s) => s.createPlan);
  const deletePlan = usePlansStore((s) => s.deletePlan);
  const clear = usePlansStore((s) => s.clear);

  const { averageMonthlySavings } = usePlanSuggestions();

  const [state, setState] = useState<SimulatorState>(() => ({
    ...DEFAULT_STATE,
    monthlyContribution:
      averageMonthlySavings > 0
        ? averageMonthlySavings
        : DEFAULT_STATE.monthlyContribution,
  }));
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      clear();
      return;
    }
    if (userId !== currentUserId) void loadForUser(currentUserId);
  }, [currentUserId, userId, loadForUser, clear]);

  async function handleSave(name: string) {
    await createPlan({
      name,
      initialAmount: state.initialAmount,
      monthlyContribution: state.monthlyContribution,
      monthlyRate: state.monthlyRate,
      months: state.months,
      targetAmount: state.targetAmount,
    });
  }

  function loadPlan(plan: PlanRecord) {
    setState({
      initialAmount: plan.initialAmount,
      monthlyContribution: plan.monthlyContribution,
      monthlyRate: plan.monthlyRate,
      months: plan.months,
      targetAmount: plan.targetAmount,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Layout subtitle="Investir" title="Planos & projeções">
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Simule quanto seu dinheiro pode render no longo prazo. Ajuste
          aportes, taxa e prazo — salve cenários para acompanhar depois.
        </p>

        <Simulator
          value={state}
          onChange={setState}
          onSaveClick={() => setDialogOpen(true)}
          averageMonthlySavings={averageMonthlySavings}
        />

        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Meus planos
            </h2>
            <span className="text-xs text-slate-500">
              {plans.length} salvo{plans.length === 1 ? '' : 's'}
            </span>
          </div>
          {plans.length === 0 ? (
            <div className="card p-4 text-sm text-slate-600">
              Você ainda não salvou nenhum plano. Use o botão{' '}
              <strong>Salvar como plano</strong> acima.
            </div>
          ) : (
            <ul className="space-y-2">
              {plans.map((p) => (
                <li key={p.id}>
                  <PlanCard
                    plan={p}
                    onDelete={(id) => void deletePlan(id)}
                    onUse={loadPlan}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SavePlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Layout>
  );
}
