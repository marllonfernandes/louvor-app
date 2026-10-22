import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const defaultIcon = variant === 'danger' ? (
    <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-3">
      <Trash2 size={22} />
    </div>
  ) : (
    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-3">
      <AlertTriangle size={22} />
    </div>
  );

  const content = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onCancel} 
      />
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-10 animate-slide-up">
        {icon !== undefined ? icon : defaultIcon}

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'primary' ? 'primary' : 'danger'} 
            onClick={onConfirm} 
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
