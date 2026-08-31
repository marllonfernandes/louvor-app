import React from 'react';
import { Calendar, Clock, MapPin, Users, Music, Trash2, Share2, MessageCircle, Edit3 } from 'lucide-react';
import { WorshipEvent, Song, Member, ConfirmationStatus } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PresenceSelector } from './PresenceSelector';
import { createMemberReminderLink } from '../../utils/whatsapp';
import { getYoutubeThumbnail } from '../../utils/youtube';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: WorshipEvent | null;
  songs: Song[];
  members: Member[];
  onStatusChange: (eventId: string, memberName: string, status: ConfirmationStatus) => void;
  onDeleteEvent: (eventId: string) => void;
  onShareWhatsApp: (event: WorshipEvent) => void;
  onSelectSong: (song: Song) => void;
  onEditEvent: (event: WorshipEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  songs,
  members,
  onStatusChange,
  onDeleteEvent,
  onShareWhatsApp,
  onSelectSong,
  onEditEvent
}) => {
  if (!event) return null;

  const eventSongs = (event.songIds || []).map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
  const confirmedEntries = Object.entries(event.confirmed || {});

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={`Escala: ${event.team || 'Escala Avulsa'}`}
    >
      <div className="space-y-4 text-left">
        {/* Barra Rápida de Ações do Topo */}
        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            {event.type && (
              <span className="text-[11px] uppercase font-bold text-blue-400 tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                {event.type}
              </span>
            )}
            <Badge variant="slate" size="sm">
              {event.team || 'Escala Avulsa'}
            </Badge>
          </div>

          <button
            onClick={() => {
              onClose();
              onEditEvent(event);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold transition-all active:scale-95"
            title="Editar este evento"
          >
            <Edit3 size={13} />
            <span>Editar</span>
          </button>
        </div>

        {/* Metadados */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar size={15} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Data</p>
              <p className="font-semibold">{event.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock size={15} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Horário</p>
              <p className="font-semibold">{event.time}</p>
            </div>
          </div>
          {event.location && (
            <div className="col-span-2 flex items-center gap-2 text-slate-300 pt-2 border-t border-slate-800/80">
              <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Local</p>
                <p className="font-semibold">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Observações */}
        {event.notes && (
          <div className="bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Observações:</p>
            <p className="text-xs text-slate-300 leading-relaxed">{event.notes}</p>
          </div>
        )}

        {/* Setlist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Music size={14} className="text-blue-600 dark:text-blue-400" />
              Repertório Escalado ({eventSongs.length})
            </h4>
          </div>

          {eventSongs.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              Nenhuma música associada a este evento.
            </p>
          ) : (
            <div className="space-y-2">
              {eventSongs.map((song, idx) => {
                const songThumb = song.url ? getYoutubeThumbnail(song.url, 'hq') : null;
                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      onClose();
                      onSelectSong(song);
                    }}
                    className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-98 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      {songThumb ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700/60">
                          <img
                            src={songThumb}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <Music size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-100 truncate">{song.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <Badge variant="blue" size="sm" className="flex-shrink-0">
                      Tom: {song.key}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Integrantes e Confirmações */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} className="text-blue-600 dark:text-blue-400" />
            Integrantes & Presença ({confirmedEntries.length})
          </h4>

          {confirmedEntries.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              Nenhum integrante escalado.
            </p>
          ) : (
            <div className="space-y-2.5">
              {confirmedEntries.map(([memberName, status]) => {
                const memberObj = members.find(m => m.name === memberName);
                const waLink = memberObj ? createMemberReminderLink(memberObj, event) : '';
                const initials = memberName
                  .split(' ')
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={memberName}
                    className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 shadow-sm text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-700">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-100 text-sm truncate">{memberName}</p>
                          {memberObj && (
                            <p className="text-[11px] text-slate-400 truncate">{memberObj.role} • {memberObj.phone}</p>
                          )}
                        </div>
                      </div>

                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/20 active:scale-95 transition-all"
                          title="Avisar no WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>Avisar</span>
                        </a>
                      )}
                    </div>

                    {/* Seletor Amplo de Presença */}
                    <PresenceSelector
                      status={status}
                      onChange={(newStatus) => onStatusChange(event.id, memberName, newStatus)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="whatsapp"
              size="sm"
              className="min-h-[42px] text-xs font-bold shadow-md"
              onClick={() => {
                onClose();
                onShareWhatsApp(event);
              }}
              icon={<Share2 size={15} />}
            >
              WhatsApp
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="min-h-[42px] text-xs font-bold shadow-md"
              onClick={() => {
                onClose();
                onEditEvent(event);
              }}
              icon={<Edit3 size={15} />}
            >
              Editar Escala
            </Button>
          </div>

          <button
            type="button"
            className="w-full text-center text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
            onClick={() => {
              if (confirm('Deseja realmente excluir este evento da escala?')) {
                onDeleteEvent(event.id);
                onClose();
              }
            }}
          >
            <Trash2 size={13} />
            <span>Excluir Evento</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
