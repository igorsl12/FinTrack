import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { Button } from '@/shared/components/Button';
import { useImport, type PreviewItem } from '@/features/import/hooks/useImport';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
  type TransactionType,
} from '@/features/transactions/types';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';

export function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    preview,
    parsing,
    confirming,
    error,
    loadFile,
    updateItem,
    setAllSelected,
    confirm,
    reset,
  } = useImport();

  function openPicker() {
    fileInputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await loadFile(file);
    e.target.value = '';
  }

  async function handleConfirm() {
    const result = await confirm();
    if (result) {
      setFeedback(
        `${result.imported} lançamento${result.imported === 1 ? '' : 's'} importado${result.imported === 1 ? '' : 's'}` +
          (result.learned > 0
            ? `. ${result.learned} regra${result.learned === 1 ? '' : 's'} aprendida${result.learned === 1 ? '' : 's'}.`
            : '.'),
      );
      window.setTimeout(() => navigate('/history'), 1200);
    }
  }

  const selectedCount = preview?.items.filter((i) => i.selected).length ?? 0;

  return (
    <Layout subtitle="Banco" title="Importar extrato">
      <div className="space-y-4">
        {!preview ? (
          <>
            <p className="text-sm text-slate-600">
              Envie um arquivo CSV do seu banco. O FinTrack identifica
              automaticamente as categorias e você revisa antes de salvar.
            </p>

            <div className="card p-6 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-balance-light text-balance-dark flex items-center justify-center">
                <FileSpreadsheet size={26} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">
                Selecione o arquivo CSV
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Suportamos Nubank (cartão e conta), Inter e formato genérico.
              </p>
              <Button
                size="lg"
                icon={Upload}
                className="mt-4 mx-auto"
                onClick={openPicker}
                loading={parsing}
              >
                Escolher arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {error && (
              <div className="card p-3 bg-expense-light text-expense-dark text-sm">
                {error}
              </div>
            )}

            <details className="card p-4 text-sm text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-800">
                Como exportar do meu banco?
              </summary>
              <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                <li>Nubank: app → Histórico → Exportar extrato (CSV).</li>
                <li>Inter: Extrato → Filtrar período → Exportar CSV.</li>
                <li>Itaú: Internet banking → Extrato → Exportar.</li>
                <li>Outros: qualquer CSV com colunas data, descrição e valor.</li>
              </ul>
            </details>
          </>
        ) : (
          <>
            <div className="card p-4 bg-balance-light text-balance-dark">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <p className="text-sm font-medium">
                  {preview.items.length} linha{preview.items.length === 1 ? '' : 's'} encontrada{preview.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <p className="mt-1 text-xs opacity-90">
                Layout detectado: <strong>{preview.profileName}</strong>. Revise
                categorias e desmarque o que não quiser importar.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{selectedCount} selecionado{selectedCount === 1 ? '' : 's'}</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setAllSelected(true)}
                >
                  Marcar tudo
                </button>
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setAllSelected(false)}
                >
                  Desmarcar tudo
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {preview.items.map((item) => (
                <PreviewRow
                  key={item.id}
                  item={item}
                  onChange={(patch) => updateItem(item.id, patch)}
                />
              ))}
            </ul>

            {feedback && (
              <div className="card p-3 bg-income-light text-income-dark text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                {feedback}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={reset}
                disabled={confirming}
              >
                Cancelar
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleConfirm}
                loading={confirming}
                disabled={selectedCount === 0}
              >
                Importar {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

interface PreviewRowProps {
  item: PreviewItem;
  onChange: (patch: Partial<PreviewItem>) => void;
}

function PreviewRow({ item, onChange }: PreviewRowProps) {
  const isIncome = item.type === 'income';
  const categories: Category[] = isIncome
    ? INCOME_CATEGORIES
    : EXPENSE_CATEGORIES;

  return (
    <li
      className={[
        'card p-3 transition-opacity',
        item.selected ? '' : 'opacity-50',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={(e) => onChange({ selected: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-balance focus:ring-balance"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-800 truncate">
              {item.description}
            </p>
            <p
              className={[
                'text-sm font-semibold whitespace-nowrap',
                isIncome ? 'text-income-dark' : 'text-expense-dark',
              ].join(' ')}
            >
              {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(item.date)}
            {item.suggestion.source === 'user-rule' && (
              <span className="ml-2 badge bg-balance-light text-balance-dark">
                regra sua
              </span>
            )}
            {item.suggestion.source === 'default-rule' && (
              <span className="ml-2 badge bg-slate-100 text-slate-600">
                sugerido
              </span>
            )}
            {item.suggestion.source === 'fallback' && (
              <span className="ml-2 badge bg-warning-light text-warning-dark">
                revisar
              </span>
            )}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const nextType: TransactionType = isIncome ? 'expense' : 'income';
                onChange({
                  type: nextType,
                  category:
                    nextType === 'income'
                      ? 'Outros (receita)'
                      : 'Outros (despesa)',
                });
              }}
              className={[
                'h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1',
                isIncome
                  ? 'bg-income-light text-income-dark'
                  : 'bg-expense-light text-expense-dark',
              ].join(' ')}
            >
              {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
              {isIncome ? 'Receita' : 'Despesa'}
            </button>
            <select
              value={item.category}
              onChange={(e) =>
                onChange({ category: e.target.value as Category })
              }
              className="h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </li>
  );
}
