import React from 'react';
import { Calendar, Clock, MapPin, Share2, Music2, ChevronRight, CheckCircle2, Check, X, Clock3 } from 'lucide-react';
import { WorshipEvent, ConfirmationStatus, Song, Member } from '../../types';
import { Badge } from '../ui/Badge';

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
  
  const acceptedCount = confirmedEntries.filter(([_, s]) => s === 'accepted').length;
  const declinedCount = confirmedEntries.filter(([_, s]) => s === 'declined').length;
  const pendingCount = confirmedEntries.filter(([_, s]) => s === 'pending').length;

  const eventSongs = (event.songIds || []).map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];

  // Formata data amigável (ex: Dom, 01 Mar)
  const formatDateFriendly = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={() => onSelectEvent(event)}
      className={`border rounded-2xl p-4 shadow-sm space-y-3 transition-all text-left cursor-pointer active:scale-[0.99] group ${
        isPast 
          ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-90' 
          : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 hover:border-blue-500/40 shadow-slate-950/20'
      }`}
    >
      {/* Linha Superior: Time, Tipo e Ação Rápida de WhatsApp */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isPast ? 'slate' : 'blue'} size="sm">
            {event.team || 'Escala Avulsa'}
          </Badge>
          {event.type && (
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider bg-slate-950/90 px-2.5 py-0.5 rounded-md border border-slate-700/60">
              {event.type}
            </span>
          )}
          {isPast && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-slate-400" />
              Realizado
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onShareWhatsApp(event);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all text-xs font-bold border border-blue-500/20 flex-shrink-0"
          title="Compartilhar escala no WhatsApp"
        >
          <Share2 size={14} />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Título, Data e Horário */}
      <div className="pt-0.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 text-blue-400 font-bold">
            <Calendar size={14} />
            {formatDateFriendly(event.date)}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300 font-semibold">
            <Clock size={14} className="text-slate-400" />
            {event.time}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1 text-slate-400 truncate max-w-[140px]">
              <MapPin size={13} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Rodapé Limpo: Resumo de Presença com Cores Padrão, Qtd Músicas e Indicador */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-700/50 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
            <Check size={11} className="stroke-[3]" />
            {acceptedCount} Confirmado{acceptedCount === 1 ? '' : 's'}
          </span>
          {declinedCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
              <X size={11} className="stroke-[3]" />
              {declinedCount} Não vai
            </span>
          )}
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
              <Clock3 size={11} />
              {pendingCount} Pendente
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-300 font-medium">
          {eventSongs.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-700 text-[11px]">
              <Music2 size={12} className="text-blue-400" />
              {eventSongs.length}
            </span>
          )}
          <span className="text-blue-400 text-xs font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Ver detalhes
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};
