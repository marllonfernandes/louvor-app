import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, FolderX, X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  songCount: number;
  onConfirm: (deleteSongsToo: boolean) => void;
}

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  isOpen,
  onClose,
  groupName,
  songCount,
  onConfirm
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 z-10 animate-slide-up text-left space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <FolderX size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">Excluir Grupo de Repertório</h3>
              <p className="text-xs text-rose-400 font-semibold mt-0.5">"{groupName}"</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagem e Contexto */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>Atenção: este grupo possui {songCount} {songCount === 1 ? 'música cadastrada' : 'músicas cadastradas'}.</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Deseja excluir também os áudios e músicas associados a este grupo ou deseja apenas remover o agrupamento, mantendo as músicas salvas no seu repertório geral?
          </p>
        </div>

        {/* Ações / Escolhas */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => onConfirm(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 transition-all active:scale-[0.99] text-left group"
          >
            <div>
              <p className="text-xs font-bold flex items-center gap-1.5">
                <Trash2 size={14} className="text-rose-400 group-hover:scale-110 transition-transform" />
                Excluir Grupo e todos os Áudios
              </p>
              <p className="text-[11px] text-rose-400/80 mt-0.5">
                Apaga o grupo e remove definitivamente as {songCount} músicas do repertório.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onConfirm(false)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-all active:scale-[0.99] text-left group"
          >
            <div>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <FolderX size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                Excluir Apenas o Grupo (Manter Áudios)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Desfaz o agrupamento. As {songCount} músicas continuarão salvas no repertório.
              </p>
            </div>
          </button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="mt-2 text-xs font-semibold py-2.5"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
