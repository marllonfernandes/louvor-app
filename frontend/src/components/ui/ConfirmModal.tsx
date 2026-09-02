import React from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onCancel} 
      />
      
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 z-10 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
