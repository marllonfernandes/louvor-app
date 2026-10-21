import React from 'react';
import { Song } from '../../types';
import { getYoutubeThumbnail } from '../../utils/youtube';

interface SongCardProps {
  song: Song;
  isLeader: boolean;
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onOpenStageSong?: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isLeader,
  onSelectSong,
  onEditSong,
  onOpenStageSong
}) => {
  const thumbnailUrl = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;

  return (
    <article
      onClick={() => onSelectSong(song)}
      className="song-card bg-surface-container hover:bg-surface-container-high rounded-2xl p-3.5 flex flex-col gap-3 shadow-md relative overflow-hidden border border-outline-variant/15 transition-all text-left cursor-pointer active:scale-[0.99] select-none group"
    >
      {/* Topo do Card */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail / Capa com overlay de equalizador */}
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex-shrink-0 overflow-hidden relative shadow-inner border border-outline-variant/20 flex items-center justify-center">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={song.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent flex items-end justify-center pb-0.5">
              <span className="material-symbols-outlined text-primary text-[14px]">graphic_eq</span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="font-headline-md text-headline-md text-on-surface truncate leading-tight font-bold group-hover:text-primary transition-colors">
              {song.title}
            </h3>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
              {song.artist || 'Ministério de Louvor'}
            </span>
          </div>
        </div>

        {isLeader && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSong(song);
            }}
            className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-90 transition-all flex-shrink-0 border border-outline-variant/20"
            title="Editar Música"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>
        )}
      </div>

      {/* Musical Metrics Row (3 colunas estilo Sanctuary Slate) */}
      <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2 rounded-xl text-center border border-outline-variant/10">
        <div className="flex flex-col items-center justify-center">
          <span className="font-label-sm text-label-sm uppercase text-outline">Tom Igreja</span>
          <span className="font-headline-sm text-headline-sm text-primary font-black">
            {song.key || 'G'}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="font-label-sm text-label-sm uppercase text-outline">Andamento</span>
          <span className="font-headline-sm text-headline-sm text-secondary font-bold">
            {song.bpm ? `${song.bpm} ` : '-- '}
            <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">BPM</span>
          </span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="font-label-sm text-label-sm uppercase text-outline">Compasso</span>
          <span className="font-headline-sm text-headline-sm text-secondary font-bold">4/4</span>
        </div>
      </div>

      {/* Tags e Links */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          {song.category && (
            <span className="bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full font-label-md text-label-md font-bold">
              {song.category}
            </span>
          )}
          {song.group && (
            <span className="bg-surface-container-high text-tertiary px-2.5 py-0.5 rounded-full font-label-md text-label-md font-bold">
              📁 {song.group}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-secondary text-[16px]" title="Cifra Disponível">
            description
          </span>
          {song.url && (
            <span className="material-symbols-outlined text-primary text-[16px]" title="Vídeo Vinculado">
              play_circle
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Ergonomic Row */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenStageSong) {
              onOpenStageSong(song);
            } else {
              onSelectSong(song);
            }
          }}
          className="btn-open-cifra bg-surface-container-high hover:bg-surface-variant text-on-surface py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all font-label-md text-label-md font-bold border border-outline-variant/20"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">auto_stories</span>
          <span>Cifra ao Vivo</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectSong(song);
          }}
          className="btn-details bg-primary-container text-on-primary-container hover:bg-primary-container/90 py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all font-label-md text-label-md font-bold shadow-sm"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Detalhes / Tom</span>
        </button>
      </div>
    </article>
  );
};
