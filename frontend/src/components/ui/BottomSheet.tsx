import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 'max-h-[90vh]'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop com blur nativo */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Conteúdo da Gaveta / Modal: Tela cheia no Mobile (com Safe Area do iPhone) e Cartão Centralizado no Desktop */}
      <div 
        className={`relative w-full sm:max-w-lg bg-slate-900 border-none sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-slide-up h-[100dvh] sm:h-auto ${maxHeight ? `sm:${maxHeight}` : 'sm:max-h-[90vh]'}`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Cabeçalho Fixo do BottomSheet com botão Fechar sempre visível e touch target acessível no iOS */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur z-20">
          <div className="min-w-0 flex-1 mr-2">
            {title && <h3 className="text-base sm:text-lg font-bold text-slate-100 truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-transparent active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Fechar janela"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do conteúdo com scroll fluido */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {children}
        </div>

        {/* Rodapé Fixo quando fornecido */}
        {footer && (
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-800/80 bg-slate-900/98 backdrop-blur shrink-0 z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
