import React from 'react';
import { ChevronRight, Pencil, Music2, FileText, Play } from 'lucide-react';
import { Song } from '../../types';
import { getYoutubeThumbnail } from '../../utils/youtube';
import { YoutubeIcon } from '../ui/YoutubeIcon';

interface SongCardProps {
  song: Song;
  isLeader: boolean;
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, isLeader, onSelectSong, onEditSong }) => {
  const thumbnailUrl = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;

  return (
    <div
      onClick={() => onSelectSong(song)}
      className="bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500/40 rounded-2xl p-3 shadow-xs space-y-2.5 transition-all text-left cursor-pointer active:scale-[0.98] select-none group"
    >
      {/* Topo do card com capa e dados principais */}
      <div className="flex items-center gap-3">
        {/* Capa / Thumbnail do YouTube ou Ícone Musical com Play Hover Spell */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/70 flex-shrink-0 flex items-center justify-center shadow-inner group-hover:border-blue-500/50 transition-colors">
          {thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt={song.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Play Spell Overlay */}
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/90 text-blue-600 flex items-center justify-center shadow-md scale-75 group-hover:scale-100 transition-transform">
                  <Play size={13} className="fill-blue-600 translate-x-0.5" />
                </div>
              </div>
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
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
              {song.title}
            </h3>
            {song.category && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-semibold">
                {song.category}
              </span>
            )}
            {song.group && (
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30 font-semibold flex items-center gap-1">
                📁 {song.group}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{song.artist}</p>
        </div>

        {/* Badge do Tom estilizado (Two-tone / Musical) e Botão de Editar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-xs font-black shadow-2xs">
            <span className="text-[10px] uppercase text-blue-500 font-extrabold">Tom</span>
            <span className="text-xs font-black">{song.key}</span>
          </span>

          {isLeader && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSong(song);
              }}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-90 transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              title="Editar Música"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Linha inferior de Metadados e Indicador de Clique */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2 flex-wrap">
          {song.bpm && (
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              ⚡ {song.bpm} BPM
            </span>
          )}
          {song.cifraUrl && (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
              <FileText size={11} />
              Cifra
            </span>
          )}
          {song.notes && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px] sm:max-w-[200px]" title={song.notes}>
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
