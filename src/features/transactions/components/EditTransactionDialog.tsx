import { X } from 'lucide-react';
import type { Transaction } from '../types';
import { TransactionForm } from './TransactionForm';

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function EditTransactionDialog({
  transaction,
  onClose,
}: EditTransactionDialogProps) {
  if (!transaction) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 px-4 pb-4 sm:pb-4 overflow-y-auto"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Editar transação
            </h2>
            <p className="text-xs text-slate-500">
              Atualize qualquer campo abaixo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <TransactionForm
          editing={transaction}
          allowRecurring={false}
          onSubmitted={() => window.setTimeout(onClose, 600)}
        />
      </div>
    </div>
  );
}
