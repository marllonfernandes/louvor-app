import React, { useState, useEffect, useRef } from 'react';
import { AdoptionSong, Member, SongCategory } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { Sparkles, Music, Disc3, Loader2, MessageSquare, User, CheckCircle } from 'lucide-react';
import { ALL_KEYS } from '../../utils/chordTransposer';
import { fetchYoutubeDetails, getYoutubeThumbnail, YoutubeDetails } from '../../utils/youtube';

interface AddAdoptionSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSaveAdoptionSong: (song: Omit<AdoptionSong, 'id'>) => void;
  defaultMemberName?: string;
}

const CATEGORIES: SongCategory[] = ['Adoração', 'Celebração', 'Ministração', 'Abertura', 'Santa Ceia', 'Geral'];

export const AddAdoptionSongModal: React.FC<AddAdoptionSongModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveAdoptionSong,
  defaultMemberName
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [suggestedKey, setSuggestedKey] = useState('C');
  const [suggestedCategory, setSuggestedCategory] = useState<SongCategory>('Adoração');
  const [suggestedBy, setSuggestedBy] = useState(defaultMemberName || members[0]?.name || '');
  const [notes, setNotes] = useState('');

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [ytDetails, setYtDetails] = useState<YoutubeDetails | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setArtist('');
      setSuggestedKey('C');
      setSuggestedCategory('Adoração');
      setSuggestedBy(defaultMemberName || members[0]?.name || '');
      setNotes('');
      setYtDetails(null);
      setAutoFilled(false);
    }
  }, [isOpen, members, defaultMemberName]);

  // Carrega dados do YouTube ao alterar a URL
  useEffect(() => {
    if (!url.trim()) {
      setYtDetails(null);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingDetails(true);
      const details = await fetchYoutubeDetails(url);
      setIsLoadingDetails(false);

      if (details && details.videoId) {
        setYtDetails(details);
        if (!title.trim() && details.parsedTitle) {
          setTitle(details.parsedTitle);
          setAutoFilled(true);
        }
        if (!artist.trim() && details.parsedArtist) {
          setArtist(details.parsedArtist);
          setAutoFilled(true);
        }
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveAdoptionSong({
      title: title.trim(),
      artist: artist.trim() || 'Artista',
      url: url.trim(),
      suggestedKey,
      suggestedCategory,
      suggestedByMemberName: suggestedBy || 'Membro do Ministério',
      notes: notes.trim(),
      createdAt: Date.now(),
      votes: suggestedBy ? [suggestedBy] : [], // Primeiro voto automático do próprio autor
      status: 'voting'
    });

    onClose();
  };

  const thumb = ytDetails?.thumbnailUrl || (url ? getYoutubeThumbnail(url) : null);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Sugerir Música para Adoção"
      subtitle="Sugira uma nova canção para a equipe votar e o líder aprovar"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Link do YouTube */}
        <Input
          label="Link do YouTube (Opcional)"
          type="url"
          placeholder="Cole o link do YouTube da canção"
          value={url}
          onChange={e => setUrl(e.target.value)}
          icon={
            isLoadingDetails ? (
              <Loader2 size={15} className="text-blue-400 animate-spin" />
            ) : (
              <YoutubeIcon size={15} className="text-rose-500" />
            )
          }
          helperText="O título e o artista são identificados automaticamente."
        />

        {/* Preview do Vídeo */}
        {thumb && (
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3 animate-fade-in">
            <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700">
              <img src={thumb} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 line-clamp-1">
                {ytDetails?.title || title || 'Vídeo do YouTube'}
              </p>
              {autoFilled && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-medium mt-0.5">
                  <CheckCircle size={10} /> Dados identificados
                </span>
              )}
            </div>
          </div>
        )}

        <Input
          label="Título da Canção"
          placeholder="Ex: Bondade de Deus"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          icon={<Music size={15} />}
        />

        <Input
          label="Artista / Ministério"
          placeholder="Ex: Isaías Saad"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          icon={<Disc3 size={15} />}
        />

        {/* Quem está sugerindo */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Quem está sugerindo?
          </label>
          <div className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium">
            {suggestedBy || 'Membro do Ministério'}
          </div>
        </div>

        {/* Tom e Categoria Sugeridos */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tom Sugerido
            </label>
            <select
              value={suggestedKey}
              onChange={e => setSuggestedKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-blue-500"
            >
              {ALL_KEYS.map(k => (
                <option key={k} value={k}>Tom {k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Momento / Estilo
            </label>
            <select
              value={suggestedCategory}
              onChange={e => setSuggestedCategory(e.target.value as SongCategory)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Justificativa / Comentário */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Por que devemos adotar essa música? (Opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Letra muito forte para momento de ministração na Santa Ceia..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth icon={<Sparkles size={15} />}>
            Enviar para Votação
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
