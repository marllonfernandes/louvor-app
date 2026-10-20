import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  Music2, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Flame,
  CheckCircle2,
  Users2
} from 'lucide-react';
import { WorshipEvent, ConfirmationStatus, Song, Member } from '../../types';
import { Badge } from '../ui/Badge';
import { MemberAvatar } from '../ui/MemberAvatar';
import { getEventTypeDefinition } from '../../utils/eventType';
import { getEventSongItems, resolveEventSong } from '../../utils/worshipEvent';
import { isSamePersonName, resolveMemberData } from '../../utils/avatar';
import { ConfettiSpell } from './ConfettiSpell';

interface HeroEventCardProps {
  event: WorshipEvent;
  songs: Song[];
  members: Member[];
  onSelectEvent: (event: WorshipEvent) => void;
  onShareWhatsApp: (event: WorshipEvent) => void;
  onStatusChange?: (eventId: string, memberName: string, status: ConfirmationStatus) => void;
  currentUserName?: string;
}

export const HeroEventCard: React.FC<HeroEventCardProps> = ({
  event,
  songs,
  members,
  onSelectEvent,
  onShareWhatsApp,
  onStatusChange,
  currentUserName
}) => {
  const [spellActive, setSpellActive] = useState(false);

  const confirmedEntries = Object.entries(event.confirmed || {});
  const acceptedCount = confirmedEntries.filter(([_, s]) => s === 'accepted').length;
  const pendingCount = confirmedEntries.filter(([_, s]) => s === 'pending').length;

  const eventSongs = getEventSongItems(event).map(item => resolveEventSong(item, songs)).filter(Boolean) as Song[];
  const typeDef = getEventTypeDefinition(event.type);

  // Identificar se o usuário logado está escalado neste evento
  const scheduledMemberEntry = currentUserName 
    ? confirmedEntries.find(([name]) => isSamePersonName(name, currentUserName))
    : null;
  const userStatus = scheduledMemberEntry ? scheduledMemberEntry[1] : null;
  const scheduledMemberName = scheduledMemberEntry ? scheduledMemberEntry[0] : null;

  // Cálculo de contagem regressiva amigável
  const getRelativeTimeString = (dateStr: string, timeStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const [hh, mm] = (timeStr || '20:00').split(':').map(Number);
      const eventDate = new Date(y, m - 1, d, hh, mm);
      const now = new Date();
      
      const diffMs = eventDate.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const isToday = now.getDate() === d && now.getMonth() === m - 1 && now.getFullYear() === y;
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const isTomorrow = tomorrow.getDate() === d && tomorrow.getMonth() === m - 1 && tomorrow.getFullYear() === y;

      if (isToday) {
        if (diffHours <= 0) return 'Começa em breve';
        return `Hoje às ${timeStr}`;
      }
      if (isTomorrow) {
        return `Amanhã às ${timeStr}`;
      }
      if (diffDays >= 2 && diffDays <= 6) {
        const weekday = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        return `Em ${diffDays} dias (${weekday})`;
      }
      return `${eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às ${timeStr}`;
    } catch {
      return `${dateStr} às ${timeStr}`;
    }
  };

  const relativeTime = getRelativeTimeString(event.date, event.time);

  const handleQuickConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scheduledMemberName || !onStatusChange) return;
    setSpellActive(true);
    onStatusChange(event.id, scheduledMemberName, 'accepted');
  };

  return (
    <div className="relative group text-left">
      {/* Container com Magic UI Border Beam */}
      <div 
        onClick={() => onSelectEvent(event)}
        className="magic-border-beam rounded-3xl p-[1.5px] shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.99] transition-all"
      >
        <div className="magic-border-beam-inner bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/50 rounded-[calc(1.5rem-1.5px)] p-4 sm:p-5 space-y-4 border border-blue-500/20 dark:border-blue-500/30">
          
          {/* Header do Hero: Tag de Destaque / Countdown + WhatsApp */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-sm tracking-wide uppercase">
                <Flame size={13} className="text-amber-300 fill-amber-300 animate-pulse" />
                Próximo Evento
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-bold">
                <Clock size={13} className="text-blue-600 dark:text-blue-400" />
                {relativeTime}
              </span>

              {event.type && (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 shadow-xs ${typeDef.badgeClass}`}>
                  <typeDef.icon size={12} className="shrink-0" />
                  <span>{typeDef.label}</span>
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onShareWhatsApp(event);
              }}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all text-xs font-bold border border-slate-200 dark:border-slate-700 flex-shrink-0"
              title="Compartilhar no WhatsApp"
            >
              <Share2 size={15} />
              <span className="hidden xs:inline">WhatsApp</span>
            </button>
          </div>

          {/* Título e Localização */}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {event.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
                {event.date}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Clock size={13} className="text-blue-600 dark:text-blue-400" />
                {event.time}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin size={13} />
                  {event.location}
                </span>
              )}
              {event.team && (
                <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                  <Users2 size={13} />
                  {event.team}
                </span>
              )}
            </div>
          </div>

          {/* Banner Interativo de Confirmação do Usuário (Design Spell) */}
          {scheduledMemberName && (
            <div className="relative rounded-2xl p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-3 overflow-hidden">
              <ConfettiSpell active={spellActive} onComplete={() => setSpellActive(false)} />
              
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  userStatus === 'accepted'
                    ? 'bg-emerald-500 text-white'
                    : userStatus === 'declined'
                    ? 'bg-rose-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {userStatus === 'accepted' ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Sparkles size={18} className="animate-spin-slow" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {userStatus === 'accepted' 
                      ? 'Sua presença está confirmada! 🎉'
                      : userStatus === 'declined'
                      ? 'Você informou ausência nesta escala'
                      : 'Você está escalado(a) neste culto!'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {userStatus === 'accepted'
                      ? 'Nos vemos lá! Toque no card para ver o repertório.'
                      : userStatus === 'declined'
                      ? 'Toque para alterar seu status se necessário.'
                      : 'Confirme sua presença com 1 toque abaixo.'}
                  </p>
                </div>
              </div>

              {userStatus !== 'accepted' && onStatusChange && (
                <button
                  type="button"
                  onClick={handleQuickConfirm}
                  className="flex-shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Confirmar</span>
                </button>
              )}
            </div>
          )}

          {/* Rodapé: Stacked Avatars da Equipe & Contagem de Músicas */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
            {/* Avatares Sobrepostos da Equipe com Indicadores */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden items-center py-0.5">
                {confirmedEntries.slice(0, 5).map(([memberName, status], idx) => {
                  const resolved = resolveMemberData(memberName, members);
                  const statusRing = 
                    status === 'accepted' 
                      ? 'ring-emerald-500' 
                      : status === 'declined' 
                      ? 'ring-rose-500' 
                      : 'ring-amber-500';

                  return (
                    <div 
                      key={`${memberName}-${idx}`} 
                      className={`relative rounded-full ring-2 ${statusRing} bg-white dark:bg-slate-900`}
                      title={`${memberName}: ${status === 'accepted' ? 'Confirmado' : status === 'declined' ? 'Ausente' : 'Pendente'}`}
                    >
                      <MemberAvatar
                        name={memberName}
                        avatarUrl={resolved.avatarUrl}
                        size="xs"
                        shape="rounded-full"
                        className="w-7 h-7 text-[10px]"
                      />
                    </div>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400">{acceptedCount}</span>/{confirmedEntries.length} confirmados
              </span>
            </div>

            {/* Músicas e Botão de Ação */}
            <div className="flex items-center gap-2">
              {eventSongs.length > 0 && (
                <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20 font-bold text-xs">
                  <Music2 size={13} />
                  {eventSongs.length} louvores
                </span>
              )}
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                Detalhes
                <ChevronRight size={15} />
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
