import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Tiny banner that appears when a new service-worker version is ready.
 * Tapping "Atualizar" reloads with the new assets.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Check for updates every hour while the tab is open
      setInterval(
        () => {
          void registration.update();
        },
        60 * 60 * 1000,
      );
    },
  });

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (needRefresh) setDismissed(false);
  }, [needRefresh]);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 mx-auto max-w-[440px] w-[calc(100%-2rem)] card p-3 bg-slate-900 text-white shadow-xl flex items-center gap-3">
      <RefreshCw size={16} />
      <p className="text-sm flex-1">Nova versão disponível.</p>
      <button
        type="button"
        onClick={() => {
          void updateServiceWorker(true);
        }}
        className="h-8 px-3 rounded-lg bg-balance text-white text-xs font-semibold hover:bg-balance-dark"
      >
        Atualizar
      </button>
      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false);
          setDismissed(true);
        }}
        className="text-white/60 hover:text-white text-xs"
      >
        Depois
      </button>
    </div>
  );
}
