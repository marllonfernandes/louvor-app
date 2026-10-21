import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmModal } from '../ui/ConfirmModal';
import { TeamNotice, NoticeCategory } from '../../types';
import { Pin, MessageCircle, AlertTriangle, Trash2, Check } from 'lucide-react';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notice: Omit<TeamNotice, 'id'> & { id?: string }, shareWhatsApp: boolean) => Promise<void>;
  onDelete?: (noticeId: string) => Promise<void>;
  noticeToEdit?: TeamNotice | null;
  currentUserName: string;
}

const CATEGORIES: { id: NoticeCategory; label: string; icon: string; color: string }[] = [
  { id: 'geral', label: 'Geral', icon: 'campaign', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'ensaio', label: 'Ensaio', icon: 'queue_music', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'urgente', label: 'Urgente', icon: 'priority_high', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { id: 'evento', label: 'Evento', icon: 'event', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'escala', label: 'Escala', icon: 'assignment', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
];

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  noticeToEdit,
  currentUserName,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('geral');
  const [message, setMessage] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [pinned, setPinned] = useState(false);
  const [shareWhatsApp, setShareWhatsApp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (noticeToEdit) {
      setTitle(noticeToEdit.title || '');
      setCategory(noticeToEdit.category || 'geral');
      setMessage(noticeToEdit.message || '');
      setHighlightText(noticeToEdit.highlightText || '');
      setPinned(Boolean(noticeToEdit.pinned));
      setShareWhatsApp(false); // Para edição não forçar compartilhamento automático por padrão
    } else {
      setTitle('');
      setCategory('geral');
      setMessage('');
      setHighlightText('');
      setPinned(false);
      setShareWhatsApp(true); // Para novo aviso, sugere compartilhar no WhatsApp
    }
  }, [noticeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave(
        {
          id: noticeToEdit?.id,
          title: title.trim(),
          category,
          message: message.trim(),
          highlightText: highlightText.trim() || undefined,
          pinned,
          authorName: noticeToEdit?.authorName || currentUserName || 'Liderança',
          createdAt: noticeToEdit?.createdAt || Date.now(),
        },
        shareWhatsApp
      );
      onClose();
    } catch (err) {
      // Erro tratado pelo toast do parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!noticeToEdit?.id || !onDelete) return;
    try {
      setIsSubmitting(true);
      await onDelete(noticeToEdit.id);
      setShowConfirmDelete(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={noticeToEdit ? 'Editar Aviso' : 'Novo Aviso no Mural'}
      subtitle="Publique avisos, alinhamentos e lembretes para a equipe"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Seletor de Categoria */}
        <div>
          <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 uppercase tracking-wider mb-2">
            Categoria do Aviso
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? `${cat.color} ring-2 ring-blue-500/50 shadow-md`
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Título */}
        <Input
          label="Título do Aviso *"
          placeholder="Ex: Ensaio Geral da Semana, Uniformes do Domingo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Mensagem */}
        <div>
          <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Mensagem do Aviso *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            placeholder="Escreva as instruções, horários, local, observações para os músicos e vocais..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y"
          />
        </div>

        {/* Lembrete de Destaque */}
        <div>
          <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Lembrete Rápido de Destaque (Opcional)</span>
            <span className="text-[10px] text-slate-400 font-normal">Badge no rodapé</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-amber-400 text-[18px]">
              alarm
            </span>
            <input
              type="text"
              value={highlightText}
              onChange={(e) => setHighlightText(e.target.value)}
              placeholder="Ex: Pontualidade no soundcheck, Chegar 15min antes..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Opções: Fixar & Compartilhar no WhatsApp */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Pin size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Fixar no Topo do Mural</span>
                <span className="text-[11px] text-slate-400">Exibido em primeiro lugar para a equipe</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <div className="border-t border-slate-800/80" />

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageCircle size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Compartilhar no WhatsApp</span>
                <span className="text-[11px] text-slate-400">Abre o WhatsApp formatado com o aviso</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shareWhatsApp}
              onChange={(e) => setShareWhatsApp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-2">
          {noticeToEdit && onDelete && (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              disabled={isSubmitting}
              className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all flex items-center justify-center active:scale-95"
              title="Excluir aviso"
            >
              <Trash2 size={18} />
            </button>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting || !title.trim() || !message.trim()}
            icon={shareWhatsApp ? <MessageCircle size={18} className="text-emerald-300" /> : <Check size={18} />}
          >
            {isSubmitting
              ? 'Salvando...'
              : shareWhatsApp
              ? 'Salvar e Abrir WhatsApp'
              : 'Salvar Aviso'}
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Excluir Aviso"
        message={`Deseja realmente excluir o aviso "${title || noticeToEdit?.title}" do mural?`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </BottomSheet>
  );
};
