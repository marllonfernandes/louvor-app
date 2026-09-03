import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-100 dark:bg-slate-950 flex justify-center selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden transition-colors duration-200">
      {/* Ocupa 100% da tela em dispositivos móveis (sem sobras) e moldura centralizada em desktop */}
      <div className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-900 h-full max-h-[100dvh] flex flex-col border-0 sm:border-x border-slate-200 dark:border-slate-800/80 sm:shadow-2xl relative overflow-hidden transition-colors duration-200">
        {children}
      </div>
    </div>
  );
};
