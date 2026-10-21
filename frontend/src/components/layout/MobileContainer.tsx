import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="h-screen h-[100dvh] w-full bg-surface-container-lowest flex justify-center selection:bg-primary-container selection:text-on-primary-container overflow-hidden transition-colors duration-200">
      {/* Ocupa 100% da tela em dispositivos móveis (sem sobras) e moldura centralizada em desktop */}
      <div className="w-full sm:max-w-md bg-surface text-on-surface h-full max-h-[100dvh] flex flex-col border-0 sm:border-x border-outline-variant/30 sm:shadow-2xl relative overflow-hidden transition-colors duration-200">
        {children}
      </div>
    </div>
  );
};
