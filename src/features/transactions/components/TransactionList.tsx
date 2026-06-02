import { Inbox } from 'lucide-react';
import type { Transaction } from '../types';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Inbox size={22} />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Nenhuma transação por aqui
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Ajuste os filtros ou registre um novo lançamento.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {transactions.map((t) => (
        <li key={t.id}>
          <TransactionItem
            transaction={t}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </li>
      ))}
    </ul>
  );
}
