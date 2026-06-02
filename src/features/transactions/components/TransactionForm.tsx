import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Repeat, X } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
  type Transaction,
  type TransactionType,
} from '../types';
import { useTransactions } from '../hooks/useTransactions';
import { getTodayKey } from '@/shared/utils/date';
import { parseCurrency } from '@/shared/utils/currency';
import { recurringRepository } from '@/shared/db/recurringRepository';
import { useAuthStore } from '@/features/auth/store/authStore';

interface TransactionFormProps {
  /** When provided, the form edits this transaction instead of creating one. */
  editing?: Transaction;
  onSubmitted?: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  /** Hide the recurring toggle (e.g. when editing). */
  allowRecurring?: boolean;
}

interface FieldErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
}

export function TransactionForm({
  editing,
  onSubmitted,
  allowRecurring = true,
}: TransactionFormProps) {
  const isEditing = !!editing;
  const { addTransaction, updateTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amountInput, setAmountInput] = useState(
    editing ? String(editing.amount).replace('.', ',') : '',
  );
  const [category, setCategory] = useState<Category | ''>(
    editing?.category ?? '',
  );
  const [date, setDate] = useState(editing?.date ?? getTodayKey());
  const [tagsInput, setTagsInput] = useState(
    editing?.tags ? editing.tags.join(', ') : '',
  );
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(
    new Date().getDate(),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setAmountInput(String(editing.amount).replace('.', ','));
      setCategory(editing.category);
      setDate(editing.date);
      setTagsInput(editing.tags ? editing.tags.join(', ') : '');
    }
  }, [editing]);

  const categories: Category[] =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const amount = parseCurrency(amountInput);

  const errors: FieldErrors = {
    description:
      description.trim().length < 2
        ? 'Descrição precisa ter ao menos 2 caracteres.'
        : undefined,
    amount: amount > 0 ? undefined : 'Informe um valor maior que zero.',
    category: category ? undefined : 'Selecione uma categoria.',
    date: date ? undefined : 'Selecione uma data.',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function showError(key: keyof FieldErrors): string | undefined {
    return touched[key] ? errors[key] : undefined;
  }

  function changeType(next: TransactionType) {
    setType(next);
    setCategory('');
    setTouched((t) => ({ ...t, category: false }));
  }

  function parseTags(): string[] {
    return tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= 24)
      .slice(0, 8);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ description: true, amount: true, category: true, date: true });
    if (hasErrors || !category) return;

    const tags = parseTags();
    const payload: Omit<Transaction, 'id' | 'createdAt'> = {
      description: description.trim(),
      amount,
      category,
      date,
      type,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (isEditing && editing) {
      await updateTransaction(editing.id, payload);
    } else {
      await addTransaction(payload);

      if (makeRecurring && allowRecurring) {
        const userId = useAuthStore.getState().currentUser?.id;
        if (userId) {
          const today = new Date();
          const generatedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
          await recurringRepository.create(userId, {
            description: payload.description,
            amount: payload.amount,
            category: payload.category,
            type: payload.type,
            dayOfMonth: Math.min(28, Math.max(1, recurringDay)),
            startDate: date,
            endDate: null,
            lastGeneratedMonth: generatedMonth,
            tags: tags,
            active: true,
          });
        }
      }
    }

    setShowSuccess(true);
    if (!isEditing) {
      setDescription('');
      setAmountInput('');
      setCategory('');
      setDate(getTodayKey());
      setTagsInput('');
      setMakeRecurring(false);
      setTouched({});
    }
    onSubmitted?.(payload);
    window.setTimeout(() => setShowSuccess(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => changeType('income')}
          className={[
            'flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all',
            type === 'income'
              ? 'bg-income text-white shadow'
              : 'text-slate-600 hover:text-slate-800',
          ].join(' ')}
        >
          <ArrowUpCircle size={18} />
          Receita
        </button>
        <button
          type="button"
          onClick={() => changeType('expense')}
          className={[
            'flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all',
            type === 'expense'
              ? 'bg-expense text-white shadow'
              : 'text-slate-600 hover:text-slate-800',
          ].join(' ')}
        >
          <ArrowDownCircle size={18} />
          Despesa
        </button>
      </div>

      <Field label="Descrição" error={showError('description')}>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, description: true }))}
          placeholder="Ex.: Mercado, Salário, Uber..."
          className="form-input"
          maxLength={80}
        />
      </Field>

      <Field label="Valor (R$)" error={showError('amount')}>
        <input
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
          placeholder="0,00"
          className="form-input"
        />
      </Field>

      <Field label="Categoria" error={showError('category')}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          onBlur={() => setTouched((t) => ({ ...t, category: true }))}
          className="form-input"
        >
          <option value="">Selecione...</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Data" error={showError('date')}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, date: true }))}
          className="form-input"
        />
      </Field>

      <Field label="Tags (separadas por vírgula)">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="viagem-2024, presente"
          className="form-input"
        />
        <TagPreview tags={parseTags()} />
      </Field>

      {allowRecurring && !isEditing && (
        <div className="card p-3 bg-slate-50 border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={makeRecurring}
              onChange={(e) => setMakeRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-balance focus:ring-balance"
            />
            <span className="text-sm font-medium text-slate-800 inline-flex items-center gap-1">
              <Repeat size={14} className="text-balance" />
              Repetir todo mês
            </span>
          </label>
          {makeRecurring && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-600">Todo dia</span>
              <input
                type="number"
                min={1}
                max={28}
                value={recurringDay}
                onChange={(e) =>
                  setRecurringDay(
                    Math.min(28, Math.max(1, Number(e.target.value))),
                  )
                }
                className="form-input w-20"
              />
              <span className="text-xs text-slate-500">
                do mês (limite 28 para evitar fevereiro)
              </span>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        variant="primary"
        className="w-full"
        disabled={hasErrors}
      >
        {isEditing ? 'Salvar alterações' : 'Salvar lançamento'}
      </Button>

      {showSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-income-light text-income-dark text-sm">
          <CheckCircle2 size={18} />
          {isEditing ? 'Alterações salvas!' : 'Lançamento registrado!'}
        </div>
      )}
    </form>
  );
}

function TagPreview({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-balance-light text-balance-dark text-[11px]"
        >
          #{t}
          <X size={10} className="opacity-60" />
        </span>
      ))}
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-expense-dark">{error}</p>}
      <style>{`
        .form-input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .form-input:focus {
          border-color: #378ADD;
          box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.15);
        }
      `}</style>
    </label>
  );
}
