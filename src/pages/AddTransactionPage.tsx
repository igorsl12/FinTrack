import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Repeat } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';

export function AddTransactionPage() {
  const navigate = useNavigate();

  return (
    <Layout subtitle="Novo registro" title="Lançar transação">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Registre receitas e despesas para acompanhar seu saldo em tempo real.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/import"
            className="card p-3 flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-balance-light text-balance-dark flex items-center justify-center shrink-0">
              <FileSpreadsheet size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800">
                Importar CSV
              </p>
              <p className="text-[11px] text-slate-500">Extrato bancário</p>
            </div>
          </Link>
          <Link
            to="/recurring"
            className="card p-3 flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-balance-light text-balance-dark flex items-center justify-center shrink-0">
              <Repeat size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800">
                Recorrências
              </p>
              <p className="text-[11px] text-slate-500">Aluguel, salário…</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 my-1">
          <span className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">ou lance manualmente</span>
          <span className="flex-1 h-px bg-slate-200" />
        </div>

        <TransactionForm
          onSubmitted={() => {
            window.setTimeout(() => navigate('/'), 1000);
          }}
        />
      </div>
    </Layout>
  );
}
