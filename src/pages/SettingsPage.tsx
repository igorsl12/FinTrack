import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  Database,
  Smartphone,
  Palette,
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { Button } from '@/shared/components/Button';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  downloadBackup,
  exportUserData,
  importBackup,
  type ImportResult,
} from '@/features/settings/backupService';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { useRecurringStore } from '@/features/recurring/store/recurringStore';
import { useBudgetStore } from '@/features/budget/store/budgetStore';
import { usePlansStore } from '@/features/plans/store/plansStore';
import { useCustomCategoryStore } from '@/features/categories/store/customCategoryStore';

export function SettingsPage() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<
    { kind: 'ok' | 'error'; text: string } | null
  >(null);

  const reloadTx = useTransactionStore((s) => s.loadForUser);
  const reloadRec = useRecurringStore((s) => s.loadForUser);
  const reloadBudget = useBudgetStore((s) => s.loadForUser);
  const reloadPlans = usePlansStore((s) => s.loadForUser);
  const reloadCategories = useCustomCategoryStore((s) => s.loadForUser);

  async function handleExport() {
    if (!currentUser) return;
    setExporting(true);
    setMessage(null);
    try {
      const backup = await exportUserData(currentUser.id);
      const fileName = downloadBackup(backup);
      setMessage({ kind: 'ok', text: `Backup gerado: ${fileName}` });
    } catch (e) {
      setMessage({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Falha ao exportar.',
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm(
      'Importar substitui os dados atuais deste usuário no dispositivo. Continuar?',
    )) {
      return;
    }
    setImporting(true);
    setMessage(null);
    try {
      const result: ImportResult = await importBackup(file);
      if (currentUser?.id === result.userId) {
        await Promise.all([
          reloadTx(result.userId),
          reloadRec(result.userId),
          reloadBudget(result.userId),
          reloadPlans(result.userId),
          reloadCategories(result.userId),
        ]);
      }
      setMessage({
        kind: 'ok',
        text: `Importado: ${result.counts.transactions} transações, ${result.counts.plans} planos, ${result.counts.budgets} orçamentos, ${result.counts.recurrings} recorrências, ${result.counts.categoryRules} regras, ${result.counts.customCategories} categorias.`,
      });
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Falha ao importar.',
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Layout subtitle="Conta" title="Configurações">
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={18} className="text-balance" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Aparência
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Escolha entre tema claro, escuro ou seguir as configurações do
            sistema.
          </p>
          <ThemeToggle />
        </div>

        <div className="card p-4 bg-balance-light text-balance-dark">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone size={18} />
            <p className="text-sm font-semibold">Por que preciso de backup?</p>
          </div>
          <p className="text-xs opacity-90">
            Seus dados ficam no navegador deste dispositivo (IndexedDB). Cada
            URL e cada celular têm seu próprio banco. Para usar o app em outro
            lugar, exporte aqui e importe no destino.
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download size={18} className="text-balance" />
            <h3 className="text-sm font-semibold text-slate-800">
              Exportar backup
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Gera um arquivo JSON com sua conta, transações, planos, orçamentos e
            recorrências. Inclui sua senha já com hash — pode ser importado em
            outro dispositivo sem perder o login.
          </p>
          <Button
            icon={Download}
            onClick={handleExport}
            loading={exporting}
            className="w-full"
          >
            Baixar fintrack-backup.json
          </Button>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload size={18} className="text-balance" />
            <h3 className="text-sm font-semibold text-slate-800">
              Importar backup
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Substitui os dados deste usuário pelos do arquivo. Útil para
            migrar do PC para o celular ou entre redes diferentes.
          </p>
          <Button
            icon={Upload}
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={importing}
            className="w-full"
          >
            Escolher arquivo .json
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {message && (
          <div
            className={[
              'card p-3 text-sm flex items-start gap-2',
              message.kind === 'ok'
                ? 'bg-income-light text-income-dark'
                : 'bg-expense-light text-expense-dark',
            ].join(' ')}
          >
            {message.kind === 'ok' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="card p-4 bg-slate-50">
          <div className="flex items-center gap-2 mb-1">
            <Database size={16} className="text-slate-600" />
            <p className="text-xs font-semibold text-slate-700">
              Detalhes técnicos
            </p>
          </div>
          <ul className="text-[11px] text-slate-500 space-y-0.5">
            <li>· Origem atual: {window.location.origin}</li>
            <li>· Usuário: {currentUser?.email ?? '—'}</li>
            <li>· Formato do backup: JSON v1 (sem criptografia)</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
