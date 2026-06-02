import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'fintrack:install-dismissed-until';

/**
 * Floating banner that appears when the browser advertises the app as
 * installable. Captures the `beforeinstallprompt` event, then shows a
 * styled CTA that triggers the native install flow. Dismissals are
 * remembered for 7 days so the banner doesn't nag the user every visit.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const dismissedUntil = Number(
      window.localStorage.getItem(DISMISSED_KEY) ?? '0',
    );
    if (dismissedUntil > Date.now()) {
      setHidden(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferred(null);
      setHidden(true);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferred(null);
    }
  }

  function dismiss() {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now() + sevenDays));
    setHidden(true);
  }

  if (hidden || !deferred) return null;

  return (
    <div className="card p-3 bg-gradient-to-br from-balance to-balance-dark text-white shadow-md flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        <Download size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Instalar FinTrack</p>
        <p className="text-xs text-white/85">
          Acesse rápido pelo ícone na tela inicial.
        </p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="h-9 px-3 rounded-xl bg-white text-balance-dark text-xs font-semibold hover:bg-white/95"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="text-white/70 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
