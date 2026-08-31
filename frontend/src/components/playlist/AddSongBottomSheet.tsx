import React, { useState, useEffect, useRef } from 'react';
import { Song, SongCategory } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { Music, Disc3, Sparkles, Loader2, Play, Image as ImageIcon, ExternalLink, CheckCircle } from 'lucide-react';
import { ALL_KEYS } from '../../utils/chordTransposer';
import { getYoutubeEmbedUrl, getYoutubeThumbnail, fetchYoutubeDetails, YoutubeDetails } from '../../utils/youtube';

interface AddSongBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSong: (song: Omit<Song, 'id'> & { id?: string }) => void;
  songToEdit?: Song | null;
}

export const AddSongBottomSheet: React.FC<AddSongBottomSheetProps> = ({
  isOpen,
  onClose,
  onSaveSong,
  songToEdit
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('C');
  const [bpm, setBpm] = useState<string>('');
  const [category, setCategory] = useState<SongCategory>('Adoração');
  const [notes, setNotes] = useState('');

  // Estados de integração com o YouTube
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [ytDetails, setYtDetails] = useState<YoutubeDetails | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (songToEdit) {
      setTitle(songToEdit.title || '');
      setArtist(songToEdit.artist || '');
      setUrl(songToEdit.url || '');
      setKey(songToEdit.key || 'C');
      setBpm(songToEdit.bpm ? String(songToEdit.bpm) : '');
      setCategory(songToEdit.category || 'Adoração');
      setNotes(songToEdit.notes || '');
      setShowPlayer(false);
      setAutoFilled(false);
    } else {
      setTitle('');
      setArtist('');
      setUrl('');
      setKey('C');
      setBpm('');
      setCategory('Adoração');
      setNotes('');
      setYtDetails(null);
      setShowPlayer(false);
      setAutoFilled(false);
    }
  }, [songToEdit, isOpen]);

  // Carrega dados do YouTube ao alterar a URL
  useEffect(() => {
    if (!url.trim()) {
      setYtDetails(null);
      setShowPlayer(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingDetails(true);
      const details = await fetchYoutubeDetails(url);
      setIsLoadingDetails(false);

      if (details && details.videoId) {
        setYtDetails(details);

        // Preenche automaticamente apenas se os campos estiverem vazios ao criar nova música
        if (!songToEdit) {
          if (!title.trim() && details.parsedTitle) {
            setTitle(details.parsedTitle);
            setAutoFilled(true);
          }
          if (!artist.trim() && details.parsedArtist) {
            setArtist(details.parsedArtist);
            setAutoFilled(true);
          }
        }
      } else {
        setYtDetails(null);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [url, songToEdit]);

  const handleApplyYoutubeMetadata = () => {
    if (ytDetails) {
      if (ytDetails.parsedTitle) setTitle(ytDetails.parsedTitle);
      if (ytDetails.parsedArtist) setArtist(ytDetails.parsedArtist);
      setAutoFilled(true);
    }
  };

  const previewEmbedUrl = getYoutubeEmbedUrl(url);
  const thumbnailUrl = ytDetails?.thumbnailUrl || getYoutubeThumbnail(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveSong({
      ...(songToEdit?.id ? { id: songToEdit.id } : {}),
      title: title.trim(),
      artist: artist.trim() || 'Artista Desconhecido',
      url: url.trim(),
      key,
      bpm: bpm ? parseInt(bpm, 10) : undefined,
      category,
      notes: notes.trim()
    });

    // Reset
    setTitle('');
    setArtist('');
    setUrl('');
    setKey('C');
    setBpm('');
    setNotes('');
    setYtDetails(null);
    setShowPlayer(false);
    onClose();
  };

  const isEditing = Boolean(songToEdit);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Louvor" : "Adicionar Louvor ao Repertório"}
      subtitle={isEditing ? "Atualize o tom base, link do YouTube ou instruções" : "Cadastre o título, tom base, link do YouTube e andamento"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Link do YouTube (Primeiro ou destacado para auto-preenchimento rápido) */}
        <div>
          <Input
            label="Link do YouTube (Opcional)"
            type="url"
            placeholder="Cole o link (ex: https://youtu.be/... ou youtube.com)"
            value={url}
            onChange={e => {
              setUrl(e.target.value);
              setAutoFilled(false);
            }}
            icon={
              isLoadingDetails ? (
                <Loader2 size={15} className="text-blue-600 dark:text-blue-400 animate-spin" />
              ) : (
                <YoutubeIcon size={15} className="text-rose-500" />
              )
            }
            helperText="Ao colar o link, a capa e os detalhes do louvor são identificados automaticamente."
          />
        </div>

        {/* Card de Detalhes / Capa do YouTube */}
        {thumbnailUrl && (
          <div className="bg-slate-950/90 border border-slate-700/90 rounded-2xl p-3 space-y-2.5 animate-fade-in shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <YoutubeIcon size={14} className="text-rose-500" />
                Mídia Identificada
              </span>
              <div className="flex items-center gap-2">
                {ytDetails && (
                  <button
                    type="button"
                    onClick={handleApplyYoutubeMetadata}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 active:scale-95 transition-all"
                    title="Preencher campos de título e artista com os dados do vídeo"
                  >
                    <Sparkles size={12} />
                    Usar dados do vídeo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPlayer(!showPlayer)}
                  className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 active:scale-95 transition-all"
                >
                  {showPlayer ? (
                    <>
                      <ImageIcon size={12} className="text-blue-600 dark:text-blue-400" />
                      Ver Capa
                    </>
                  ) : (
                    <>
                      <Play size={12} className="text-rose-400" />
                      Testar Player
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Visualizador: Capa ou Player Iframe corrigido */}
            {showPlayer && previewEmbedUrl ? (
              <div className="relative w-full pt-[52%] rounded-xl overflow-hidden bg-black border border-slate-700 shadow-md">
                <iframe
                  src={previewEmbedUrl}
                  title="YouTube Preview"
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center gap-3 p-2">
                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-950 border border-slate-700">
                  <img
                    src={thumbnailUrl}
                    alt="Capa do YouTube"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => {
                      // Fallback em caso de erro na imagem
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytDetails?.videoId || ''}/default.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <YoutubeIcon size={18} className="text-white drop-shadow" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-100 line-clamp-1">
                    {ytDetails?.title || title || 'Vídeo do YouTube'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {ytDetails?.authorName ? `Canal: ${ytDetails.authorName}` : artist || 'Canal do YouTube'}
                  </p>
                  {autoFilled && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                      <CheckCircle size={10} /> Preenchido automaticamente
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Input
          label="Título do Louvor"
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

        <div className="grid grid-cols-2 gap-2.5">
          {/* Seleção do Tom */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tom Base
            </label>
            <select
              value={key}
              onChange={e => setKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
            >
              {ALL_KEYS.map(k => (
                <option key={k} value={k}>
                  Tom: {k}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="BPM (Andamento)"
            type="number"
            placeholder="Ex: 72"
            value={bpm}
            onChange={e => setBpm(e.target.value)}
          />
        </div>

        {/* Categoria / Momento do Culto */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Momento / Estilo
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['Adoração', 'Celebração', 'Ministração', 'Abertura', 'Santa Ceia', 'Geral'] as SongCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  category === cat
                    ? 'bg-blue-600 text-white shadow-md border border-blue-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Notas adicionais */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Instruções de Arranjo ou Dinâmica
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Iniciar com violão suave, ponte com bateria marcando forte..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {isEditing ? "Salvar Alterações" : "Salvar Música"}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
