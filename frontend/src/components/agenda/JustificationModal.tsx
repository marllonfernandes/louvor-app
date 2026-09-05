import React from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';

interface JustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  memberName: string;
}

export const JustificationModal: React.FC<JustificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  memberName
}) => {
  const options = [
    'Não Escalado',
    'Trabalho',
    'Saúde',
    'Pessoal',
    'Estudo',
    'Outro'
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Justificativa de Ausência"
      subtitle={`Por que ${memberName} não poderá participar?`}
    >
      <div className="space-y-3 p-2 text-left">
        <p className="text-sm text-slate-300 mb-4">
          Por favor, selecione o motivo da ausência:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onConfirm(option);
                onClose();
              }}
              className="flex items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-all text-sm font-semibold active:scale-95"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="pt-4 mt-2 border-t border-slate-800">
          <Button variant="secondary" className="w-full" onClick={onClose} icon={<X size={16} />}>
            Cancelar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
