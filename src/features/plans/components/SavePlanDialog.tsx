import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/Button';

interface SavePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void> | void;
  defaultName?: string;
}

export function SavePlanDialog({
  open,
  onClose,
  onSave,
  defaultName = '',
}: SavePlanDialogProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setSaving(true);
    try {
      await onSave(trimmed);
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
          <h2 className="text-base font-semibold text-slate-900">
            Salvar este plano
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
          Dê um nome para acompanhar essa simulação depois.
        </p>

        <label className="block mt-4">
          <span className="text-xs font-medium text-slate-600">Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Reserva de emergência"
            className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
            autoFocus
            maxLength={60}
          />
        </label>

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={name.trim().length < 2}>
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
