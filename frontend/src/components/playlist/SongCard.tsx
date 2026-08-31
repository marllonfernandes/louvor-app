import React from 'react';
import { ChevronRight, Pencil, Music2 } from 'lucide-react';
import { Song } from '../../types';
import { Badge } from '../ui/Badge';
import { getYoutubeThumbnail } from '../../utils/youtube';
import { YoutubeIcon } from '../ui/YoutubeIcon';

interface SongCardProps {
  song: Song;
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, onSelectSong, onEditSong }) => {
  const thumbnailUrl = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;

  return (
    <div
      onClick={() => onSelectSong(song)}
      className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 rounded-2xl p-3 shadow-sm space-y-2.5 transition-all text-left cursor-pointer active:scale-[0.99] group"
    >
      {/* Topo do card com capa e dados principais */}
      <div className="flex items-center gap-3">
        {/* Capa / Thumbnail do YouTube ou Ícone Musical */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/70 flex-shrink-0 flex items-center justify-center shadow-inner group-hover:border-blue-500/50 transition-colors">
          {thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt={song.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  // Fallback se a imagem não carregar
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute bottom-1 right-1 bg-slate-950/80 rounded-md p-0.5">
                <YoutubeIcon size={10} className="text-rose-500" />
              </div>
            </>
          ) : (
            <div className="text-blue-600 dark:text-blue-400/80">
              <Music2 size={22} />
            </div>
          )}
        </div>

        {/* Informações da Música */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-blue-700 dark:text-blue-300 transition-colors truncate">
              {song.title}
            </h3>
            {song.category && (
              <span className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-semibold">
                {song.category}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{song.artist}</p>
        </div>

        {/* Badge do Tom e Ação */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="blue" size="md">
            Tom: {song.key}
          </Badge>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSong(song);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:text-blue-400 hover:bg-slate-700/80 active:scale-95 transition-all bg-slate-900 border border-slate-700/60"
            title="Editar Música"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Linha inferior de Metadados e Indicador de Clique */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          {song.bpm && (
            <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              ⚡ {song.bpm} BPM
            </span>
          )}
          {song.notes && (
            <span className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" title={song.notes}>
              💬 {song.notes}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
          <span>Ver detalhes</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};
