import React from 'react';
import { WorshipEvent, ConfirmationStatus, Song, Member } from '../../types';
import { getEventTypeDefinition } from '../../utils/eventType';
import { getEventBlocksOrder, getEventSongItems, resolveEventSong } from '../../utils/worshipEvent';

interface EventCardProps {
  event: WorshipEvent;
  songs: Song[];
  members: Member[];
  onStatusChange: (eventId: string, memberName: string, status: ConfirmationStatus) => void;
  onSelectEvent: (event: WorshipEvent) => void;
  onShareWhatsApp: (event: WorshipEvent) => void;
  isPast?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  songs,
  onSelectEvent,
  onShareWhatsApp,
  isPast = false
}) => {
  const confirmedEntries = Object.entries(event.confirmed || {});
  const totalCount = confirmedEntries.length;
  const acceptedCount = confirmedEntries.filter(([_, s]) => s === 'accepted').length;

  const eventSongs = getEventSongItems(event).map(item => resolveEventSong(item, songs)).filter(Boolean) as Song[];
  const typeDef = getEventTypeDefinition(event.type);
  const eventBlocks = getEventBlocksOrder(event);

  // Formata data amigável (ex: Domingo • 01/Dez)
  const formatDateFriendly = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const day = d.toString().padStart(2, '0');
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      return `${weekday.toUpperCase()} • ${day} ${month}`;
    } catch {
      return dateStr;
    }
  };

  const isClosed = totalCount > 0 && acceptedCount === totalCount;

  return (
    <article
      onClick={() => onSelectEvent(event)}
      className={`rounded-2xl p-4 shadow-md transition-all text-left cursor-pointer active:scale-[0.99] border ${
        isPast
          ? 'bg-surface-container-lowest/70 border-outline-variant/15 opacity-80'
          : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20 shadow-sm'
      }`}
    >
      {/* Linha Superior: Ícone Litúrgico, Data/Hora e Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-[24px]">church</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-label-sm text-label-sm font-extrabold uppercase text-primary px-2 py-0.5 rounded-md bg-primary-container/20">
                {formatDateFriendly(event.date)}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                {event.time || '19:00'}
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5 leading-snug truncate font-bold">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Indicador de Status da Escala */}
        <span 
          className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
            isClosed ? 'bg-emerald-400' : 'bg-amber-400'
          }`} 
          title={isClosed ? 'Escala 100% Confirmada' : 'Presenças Pendentes'}
        />
      </div>

      {/* Bloco de Detalhes Internos */}
      <div className="mt-3 pt-3 flex flex-col gap-2 bg-surface-container-lowest/60 rounded-xl p-3 border border-outline-variant/10">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[17px] text-primary">group</span>
            <span className="font-body-sm text-body-sm truncate">
              {event.team || 'Banda Principal'}
            </span>
          </div>
          {typeDef.label && (
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-bold">
              {typeDef.label}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
            <span className="truncate">{event.location || 'Templo Principal'}</span>
          </div>

          {totalCount > 0 ? (
            <div className={`flex items-center gap-1 font-label-sm text-label-sm font-bold shrink-0 ${
              isClosed ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <span className="material-symbols-outlined text-[15px]">
                {isClosed ? 'check_circle' : 'schedule'}
              </span>
              <span>{acceptedCount}/{totalCount} Confirmados</span>
            </div>
          ) : (
            <span className="font-label-sm text-label-sm text-on-surface-variant">Sem escalados</span>
          )}
        </div>

        {eventBlocks.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-outline-variant/10">
            <span className="material-symbols-outlined text-[14px] text-tertiary">layers</span>
            <span className="font-label-sm text-label-sm text-tertiary truncate">
              {eventBlocks.join(' • ')}
            </span>
          </div>
        )}
      </div>

      {/* Ações Inferiores: Músicas e WhatsApp */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-label-md text-label-md text-primary hover:underline">
          <span className="material-symbols-outlined text-[18px]">playlist_play</span>
          <span>{eventSongs.length} {eventSongs.length === 1 ? 'música' : 'músicas'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShareWhatsApp(event);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface active:scale-95 transition-all text-xs font-bold border border-outline-variant/20"
            title="Compartilhar escala no WhatsApp"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-400">share</span>
            <span>WhatsApp</span>
          </button>

          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
            chevron_right
          </span>
        </div>
      </div>
    </article>
  );
};
