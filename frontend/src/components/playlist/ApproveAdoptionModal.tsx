import React, { useState, useEffect } from 'react';
import { AdoptionSong, Song, Member, SongCategory } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Crown, CheckCircle2, Music, Disc3, Sparkles } from 'lucide-react';
import { ALL_KEYS } from '../../utils/chordTransposer';
import { getYoutubeThumbnail } from '../../utils/youtube';
import { useAuth } from '../../context/AuthContext';

interface ApproveAdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  adoptionSong: AdoptionSong | null;
  leaders: Member[];
  onApproveConfirm: (adoptionSongId: string, approvedSongData: Omit<Song, 'id'>, leaderName: string) => void;
}

const CATEGORIES: SongCategory[] = ['Adoração', 'Celebração', 'Ministração', 'Abertura', 'Santa Ceia', 'Geral'];

export const ApproveAdoptionModal: React.FC<ApproveAdoptionModalProps> = ({
  isOpen,
  onClose,
  adoptionSong,
  leaders,
  onApproveConfirm
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [finalKey, setFinalKey] = useState('C');
  const [finalCategory, setFinalCategory] = useState<SongCategory>('Adoração');
  const [notes, setNotes] = useState('');

  const { userProfile } = useAuth();
  const leaderName = userProfile?.name || 'Líder de Louvor';

  useEffect(() => {
    if (adoptionSong) {
      setTitle(adoptionSong.title || '');
      setArtist(adoptionSong.artist || '');
      setFinalKey(adoptionSong.suggestedKey || 'C');
      setFinalCategory(adoptionSong.suggestedCategory || 'Adoração');
      setNotes(adoptionSong.notes || '');
    }
  }, [adoptionSong]);

  if (!adoptionSong) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onApproveConfirm(
      adoptionSong.id,
      {
        title: title.trim(),
        artist: artist.trim() || 'Artista',
        url: adoptionSong.url || '',
        key: finalKey,
        category: finalCategory,
        notes: notes.trim(),
        createdAt: Date.now()
      },
      leaderName
    );

    onClose();
  };

  const thumb = adoptionSong.url ? getYoutubeThumbnail(adoptionSong.url, 'hq') : null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Aprovação do Líder de Louvor"
      subtitle="Defina o tom oficial e inclua esta canção no repertório principal"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Banner de Aprovação com Votos */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Aprovação do Líder</p>
              <p className="text-[11px] text-amber-200/80">
                {adoptionSong.votes.length} voto{adoptionSong.votes.length === 1 ? '' : 's'} da equipe
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl">
            Pronta para adoção
          </span>
        </div>

        {/* Informações da Música */}
        <div className="space-y-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            {thumb ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700">
                <img src={thumb} alt={title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Music size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100 truncate">{title}</p>
              <p className="text-xs text-slate-400 truncate">{artist}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tom Oficial
              </label>
              <select
                value={finalKey}
                onChange={e => setFinalKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-blue-500"
              >
                {ALL_KEYS.map(k => (
                  <option key={k} value={k}>Tom {k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria Oficial
              </label>
              <select
                value={finalCategory}
                onChange={e => setFinalCategory(e.target.value as SongCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Líder que está aprovando */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Líder Responsável pela Aprovação
          </label>
          <div className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium">
            {leaderName} (Líder)
          </div>
        </div>

        {/* Instruções de Arranjo ou Dinâmica */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Instruções ou Observações para a Equipe
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Tocar no tom oficial F, atentar para o solo de guitarra na ponte..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="bg-amber-600 hover:bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md"
            icon={<CheckCircle2 size={16} />}
          >
            Aprovar e Publicar no Repertório
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
