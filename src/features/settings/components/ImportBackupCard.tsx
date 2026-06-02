import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { importBackup, type ImportResult } from '../backupService';

interface ImportBackupCardProps {
  /** Optional callback after a successful import. */
  onImported?: (result: ImportResult) => void;
}

/**
 * Self-contained "Importar backup" card used both on the LoginPage (so a
 * fresh phone install can pull data from the user's PC before logging in)
 * and as a building block elsewhere if needed.
 */
export function ImportBackupCard({ onImported }: ImportBackupCardProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    { kind: 'ok' | 'error'; text: string } | null
  >(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await importBackup(file);
      setMessage({
        kind: 'ok',
        text: `Dados de ${result.userEmail} restaurados. Faça login com suas credenciais.`,
      });
      onImported?.(result);
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Falha ao importar.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">
        Já tem um backup do FinTrack?
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Importe o JSON exportado do seu outro dispositivo. Depois entre com seu
        email e senha de sempre.
      </p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="mt-3 w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Upload size={14} />
        {busy ? 'Importando…' : 'Escolher arquivo .json'}
      </button>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        onChange={handle}
        className="hidden"
      />
      {message && (
        <div
          className={[
            'mt-3 rounded-xl px-3 py-2 text-xs flex items-start gap-2',
            message.kind === 'ok'
              ? 'bg-income-light text-income-dark'
              : 'bg-expense-light text-expense-dark',
          ].join(' ')}
        >
          {message.kind === 'ok' ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
