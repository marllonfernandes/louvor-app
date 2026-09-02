import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-xl p-4 max-w-sm w-full flex items-start gap-4">
        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg shrink-0">
          <RefreshCw size={24} className={needRefresh ? 'animate-spin' : ''} />
        </div>
        
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-bold text-white mb-1">
            {offlineReady ? 'App pronto para uso offline' : 'Nova versão disponível!'}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            {offlineReady 
              ? 'Você pode acessar as escalas mesmo sem internet.' 
              : 'Clique em recarregar para aplicar a nova versão do aplicativo.'}
          </p>
          
          <div className="flex gap-2">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-md transition-colors"
              >
                Recarregar agora
              </button>
            )}
            <button
              onClick={close}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
        
        <button onClick={close} className="text-slate-500 hover:text-white absolute top-3 right-3 p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
