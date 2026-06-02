import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Pause,
  Play,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { Button } from '@/shared/components/Button';
import { useRecurringStore } from '@/features/recurring/store/recurringStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { formatCurrency } from '@/shared/utils/currency';
import type { RecurringRecord } from '@/shared/db/database';

export function RecurringPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.currentUser?.id ?? null);
  const recurrings = useRecurringStore((s) => s.recurrings);
  const storeUser = useRecurringStore((s) => s.userId);
  const loadForUser = useRecurringStore((s) => s.loadForUser);
  const clear = useRecurringStore((s) => s.clear);
  const toggleActive = useRecurringStore((s) => s.toggleActive);
  const remove = useRecurringStore((s) => s.remove);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) clear();
    else if (storeUser !== userId) void loadForUser(userId);
  }, [userId, storeUser, loadForUser, clear]);

  return (
    <Layout subtitle="Automação" title="Recorrências">
      <div className="space-y-4">
        <div className="card p-4 bg-balance-light text-balance-dark">
          <div className="flex items-center gap-2">
            <Repeat size={18} />
            <p className="text-sm font-medium">
              Lançamentos que se repetem todo mês
            </p>
          </div>
          <p className="mt-1 text-xs opacity-90">
            Aluguel, salário, assinaturas. Quando ativos, o app cria a
            transação automaticamente no dia configurado.
          </p>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            className="mt-3"
            onClick={() => navigate('/add')}
          >
            Criar nova
          </Button>
        </div>

        {recurrings.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-600">
            Nenhuma recorrência cadastrada.
            <p className="mt-1 text-xs text-slate-500">
              Vá em <strong>Lançar</strong> e marque "Repetir todo mês" no
              formulário.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recurrings.map((r) => (
              <li key={r.id}>
                <RecurringRow
                  recurring={r}
                  onToggle={(active) => void toggleActive(r.id, active)}
                  onDelete={() => setConfirmId(r.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 px-4 pb-24 sm:pb-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">
              Excluir recorrência?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              As transações já geradas serão mantidas. Apenas paramos de
              criar novas.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setConfirmId(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void remove(confirmId);
                  setConfirmId(null);
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

interface RecurringRowProps {
  recurring: RecurringRecord;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

function RecurringRow({ recurring, onToggle, onDelete }: RecurringRowProps) {
  const isIncome = recurring.type === 'income';
  return (
    <div
      className={[
        'card p-3 flex items-center gap-3 transition-opacity',
        recurring.active ? '' : 'opacity-60',
      ].join(' ')}
    >
      <div
        className={[
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          isIncome
            ? 'bg-income-light text-income-dark'
            : 'bg-expense-light text-expense-dark',
        ].join(' ')}
      >
        {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {recurring.description}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="badge bg-slate-100 text-slate-600">
            {recurring.category}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays size={11} />
            Dia {recurring.dayOfMonth}
          </span>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <p
          className={[
            'text-sm font-semibold whitespace-nowrap',
            isIncome ? 'text-income-dark' : 'text-expense-dark',
          ].join(' ')}
        >
          {isIncome ? '+' : '-'} {formatCurrency(recurring.amount)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(!recurring.active)}
            aria-label={recurring.active ? 'Pausar' : 'Ativar'}
            className="text-slate-400 hover:text-balance"
          >
            {recurring.active ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Excluir"
            className="text-slate-400 hover:text-expense"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
