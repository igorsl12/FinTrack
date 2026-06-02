import { useEffect, useMemo, useState } from 'react';
import { Search, Tag, X } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { TransactionList } from '@/features/transactions/components/TransactionList';
import { EditTransactionDialog } from '@/features/transactions/components/EditTransactionDialog';
import { Button } from '@/shared/components/Button';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import type {
  Transaction,
  TransactionType,
} from '@/features/transactions/types';
import { getMonthLabel } from '@/shared/utils/date';

type FilterType = 'all' | TransactionType;

export function HistoryPage() {
  const {
    getFilteredTransactions,
    deleteTransaction,
    availableMonths,
    availableTags,
  } = useTransactions();

  const [type, setType] = useState<FilterType>('all');
  const [month, setMonth] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const transactions = useMemo(
    () =>
      getFilteredTransactions({
        type: type === 'all' ? undefined : type,
        month: month || undefined,
        tag: tag || undefined,
        search: search || undefined,
      }),
    [getFilteredTransactions, type, month, tag, search],
  );

  function confirmDelete() {
    if (confirmId) {
      void deleteTransaction(confirmId);
      setConfirmId(null);
    }
  }

  return (
    <Layout subtitle="Histórico" title="Extrato">
      <div className="space-y-3">
        <div className="card p-3 space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por descrição..."
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['all', 'income', 'expense'] as FilterType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={[
                  'h-9 rounded-lg font-medium transition-colors',
                  type === t
                    ? 'bg-balance text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
            >
              <option value="">Todos os meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
            <div className="relative">
              <Tag
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                disabled={availableTags.length === 0}
                className="h-10 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-sm bg-white outline-none focus:border-balance focus:ring-2 focus:ring-balance/20 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Todas as tags</option>
                {availableTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <TransactionList
          transactions={transactions}
          onDelete={(id) => setConfirmId(id)}
          onEdit={(t) => setEditing(t)}
        />
      </div>

      {confirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 px-4 pb-24 sm:pb-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">
              Excluir transação?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Essa ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setConfirmId(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <EditTransactionDialog
        transaction={editing}
        onClose={() => setEditing(null)}
      />
    </Layout>
  );
}
