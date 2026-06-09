import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useCustomCategoryStore } from '../store/customCategoryStore';
import type { TransactionType } from '@/features/transactions/types';

interface AddCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  /** Restrict the dialog to a single transaction type (e.g. only expense in BudgetPage). */
  fixedType?: TransactionType;
  /** Optional callback when a category is created successfully. */
  onCreated?: (name: string, type: TransactionType) => void;
}

export function AddCategoryDialog({
  open,
  onClose,
  fixedType,
  onCreated,
}: AddCategoryDialogProps) {
  const add = useCustomCategoryStore((s) => s.add);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(fixedType ?? 'expense');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await add({ name, type });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated?.(result.record.name, result.record.type);
      setName('');
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 px-4 pb-24 sm:pb-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-balance" />
            Nova categoria
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Crie uma categoria personalizada para classificar suas transações.
        </p>

        {!fixedType && (
          <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={[
                'h-9 rounded-xl text-xs font-semibold transition-colors',
                type === 'expense'
                  ? 'bg-expense text-white'
                  : 'text-slate-600 hover:text-slate-800',
              ].join(' ')}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={[
                'h-9 rounded-xl text-xs font-semibold transition-colors',
                type === 'income'
                  ? 'bg-income text-white'
                  : 'text-slate-600 hover:text-slate-800',
              ].join(' ')}
            >
              Receita
            </button>
          </div>
        )}

        <label className="block mt-4">
          <span className="text-xs font-medium text-slate-600">Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Pets, Assinaturas, Presentes..."
            className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
            autoFocus
            maxLength={30}
          />
        </label>

        {error && (
          <p className="mt-2 text-xs text-expense-dark bg-expense-light rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={name.trim().length < 2}>
            Criar
          </Button>
        </div>
      </form>
    </div>
  );
}
