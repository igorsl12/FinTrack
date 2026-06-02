import { Link } from 'react-router-dom';
import { FileSpreadsheet, PlusCircle, Sparkles } from 'lucide-react';

export function EmptyDashboard() {
  return (
    <div className="card p-6 text-center bg-gradient-to-br from-balance-light to-white">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-balance text-white flex items-center justify-center shadow-sm">
        <Sparkles size={26} />
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">
        Vamos começar?
      </h3>
      <p className="mt-1 text-sm text-slate-600 max-w-xs mx-auto">
        Registre seu primeiro lançamento manualmente ou importe um extrato
        bancário para o app já organizar tudo pra você.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to="/add"
          className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-balance text-white text-sm font-medium hover:bg-balance-dark"
        >
          <PlusCircle size={16} />
          Lançar
        </Link>
        <Link
          to="/import"
          className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          <FileSpreadsheet size={16} />
          Importar CSV
        </Link>
      </div>
    </div>
  );
}
