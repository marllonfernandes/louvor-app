import React, { useState } from 'react';
import { Music, Trash2, ArrowUp, ArrowDown, RefreshCw, Pencil, Play, ExternalLink } from 'lucide-react';
import { Song } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { YoutubeIcon } from '../ui/YoutubeIcon';
import { getYoutubeEmbedUrl, getYoutubeThumbnail } from '../../utils/youtube';
import { transposeKey } from '../../utils/chordTransposer';
import { useAuth } from '../../context/AuthContext';

interface SongDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onEditSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({
  isOpen,
  onClose,
  song,
  onEditSong,
  onDeleteSong
}) => {
  const [transposeOffset, setTransposeOffset] = useState(0);
  const { userProfile } = useAuth();
  const isLeader = userProfile?.role === 'Líder';

  if (!song) return null;

  const currentKey = transposeKey(song.key, transposeOffset);
  const embedUrl = getYoutubeEmbedUrl(song.url);
  const thumbnailUrl = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;

  const handleResetTranspose = () => setTransposeOffset(0);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={song.title}
      subtitle={song.artist}
    >
      <div className="space-y-4 text-left">
        {/* Ferramenta de Transposição de Tom */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Music size={14} className="text-blue-600 dark:text-blue-400" />
              Transpositor de Tom
            </span>
            {transposeOffset !== 0 && (
              <button
                onClick={handleResetTranspose}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw size={11} />
                Original ({song.key})
              </button>
            )}
          </div>

          <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/60">
            <Button
              size="sm"
              variant="secondary"
              className="min-h-[38px] px-3 text-xs"
              onClick={() => setTransposeOffset(prev => prev - 1)}
              icon={<ArrowDown size={14} />}
            >
              -1 Semitom
            </Button>

            <div className="text-center px-3">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block tracking-tight">
                {currentKey}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {transposeOffset === 0 ? 'Tom Original' : `${transposeOffset > 0 ? '+' : ''}${transposeOffset} semitons`}
              </span>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="min-h-[38px] px-3 text-xs"
              onClick={() => setTransposeOffset(prev => prev + 1)}
              icon={<ArrowUp size={14} />}
            >
              +1 Semitom
            </Button>
          </div>
        </div>

        {/* Player de Vídeo e Capa */}
        {embedUrl ? (
          <div className="relative w-full pt-[56.25%] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
            <iframe
              src={embedUrl}
              title={song.title}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : thumbnailUrl ? (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
            <img
              src={thumbnailUrl}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-400 border border-slate-800">
            Link do YouTube não informado.
          </div>
        )}

        {/* Metadados */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {song.bpm && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">BPM / Andamento</p>
              <p className="font-bold text-slate-200">{song.bpm} BPM</p>
            </div>
          )}
          {song.category && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Categoria</p>
              <p className="font-bold text-slate-200">{song.category}</p>
            </div>
          )}
        </div>

        {/* Observações da Música */}
        {song.notes && (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-medium mb-1">Notas de Arranjo / Instruções</p>
            <p className="text-xs text-slate-300 leading-relaxed">{song.notes}</p>
          </div>
        )}

        {/* Links Externos e Ações */}
        <div className="pt-2 space-y-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {song.url && (
              <a
                href={song.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center font-bold text-xs px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white gap-1.5 shadow-md active:scale-95 transition-all min-h-[42px]"
              >
                <YoutubeIcon size={16} />
                <span>Abrir no YouTube</span>
                <ExternalLink size={12} className="opacity-70" />
              </a>
            )}

            {isLeader && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 min-h-[42px] px-3.5 text-xs font-bold"
                  onClick={() => {
                    onClose();
                    onEditSong(song);
                  }}
                  icon={<Pencil size={15} />}
                >
                  Editar
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  className="min-h-[42px] px-3.5 text-xs font-bold flex-shrink-0"
                  onClick={() => {
                    if (confirm(`Deseja realmente remover "${song.title}" do repertório?`)) {
                      onDeleteSong(song.id);
                      onClose();
                    }
                  }}
                  icon={<Trash2 size={15} />}
                >
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
