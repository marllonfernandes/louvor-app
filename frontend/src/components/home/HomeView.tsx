import React, { useState, useMemo } from 'react';
import { WorshipEvent, Song, Member, ConfirmationStatus, TabType, TeamNotice, NoticeCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { resolveEventSong, getEventSongItems, deduplicateConfirmed } from '../../utils/worshipEvent';
import { isSamePersonName, resolveMemberData } from '../../utils/avatar';
import { createShareNoticeWhatsAppLink } from '../../utils/whatsapp';
import { MemberAvatar } from '../ui/MemberAvatar';
import { MetronomeModal } from '../stage/MetronomeModal';
import { TunerModal } from '../stage/TunerModal';
import { JustificationModal } from '../agenda/JustificationModal';
import { NoticeModal } from './NoticeModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { MessageCircle, Pin, Plus, Edit2, Trash2 } from 'lucide-react';

interface HomeViewProps {
  events: WorshipEvent[];
  songs: Song[];
  members: Member[];
  notices?: TeamNotice[];
  onSelectEvent: (event: WorshipEvent) => void;
  onSelectSong: (song: Song) => void;
  onOpenStageSong: (song: Song) => void;
  onStatusChange: (eventId: string, memberName: string, status: ConfirmationStatus, justification?: string) => void;
  onChangeTab: (tab: TabType) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  onSaveNotice?: (notice: Omit<TeamNotice, 'id'> & { id?: string }, shareWhatsApp?: boolean) => Promise<void>;
  onDeleteNotice?: (noticeId: string) => Promise<void>;
  onTogglePinNotice?: (noticeId: string, currentPinned?: boolean) => Promise<void>;
}

const CATEGORY_MAP: Record<NoticeCategory, { label: string; icon: string; bg: string; text: string }> = {
  geral: { label: 'Aviso', icon: 'campaign', bg: 'bg-blue-500/20 text-blue-400', text: 'text-blue-400' },
  ensaio: { label: 'Ensaio', icon: 'queue_music', bg: 'bg-amber-500/20 text-amber-400', text: 'text-amber-400' },
  urgente: { label: 'Urgente', icon: 'priority_high', bg: 'bg-rose-500/20 text-rose-400', text: 'text-rose-400' },
  evento: { label: 'Evento', icon: 'event', bg: 'bg-purple-500/20 text-purple-400', text: 'text-purple-400' },
  escala: { label: 'Escala', icon: 'assignment', bg: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
};

function formatNoticeDate(timestamp: number) {
  try {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (isToday) {
      return `Hoje às ${hours}:${mins}`;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month} às ${hours}:${mins}`;
  } catch {
    return '';
  }
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  songs,
  members,
  notices = [],
  onSelectEvent,
  onOpenStageSong,
  onStatusChange,
  onChangeTab,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onSaveNotice,
  onDeleteNotice,
  onTogglePinNotice
}) => {
  const { userProfile, currentUser } = useAuth();
  const userName = userProfile?.name || currentUser?.displayName || 'Músico';
  const firstName = userName.split(' ')[0];

  const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [justificationModalEvent, setJustificationModalEvent] = useState<WorshipEvent | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<TeamNotice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<TeamNotice | null>(null);

  const isLeaderOrAdmin = ['Admin', 'Editor'].includes(userProfile?.systemRole || '') ||
    Boolean(userProfile?.roles?.includes('Líder')) ||
    Boolean(userProfile?.role?.toLowerCase().includes('líder'));

  // Encontrar o próximo culto
  const now = new Date();
  const sortedUpcomingEvents = [...events]
    .filter(ev => {
      try {
        const [y, m, d] = ev.date.split('-').map(Number);
        const [hh, mm] = (ev.time || '23:59').split(':').map(Number);
        const evDate = new Date(y, m - 1, d, hh, mm);
        return evDate.getTime() >= now.getTime() - 2 * 60 * 60 * 1000; // Até 2h após o início
      } catch {
        return true;
      }
    })
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

  const upcomingEvent = sortedUpcomingEvents[0] || events[0] || null;

  // Escalação e status do usuário (com deduplicação de nomes)
  const upcomingConfirmed = useMemo(
    () => deduplicateConfirmed(upcomingEvent?.confirmed || {}),
    [upcomingEvent?.confirmed]
  );

  const userScheduledEntry = upcomingEvent?.confirmed
    ? Object.entries(upcomingConfirmed).find(([name]) => isSamePersonName(name, userName))
    : null;

  const isUserScheduled = Boolean(userScheduledEntry);
  const userStatus = userScheduledEntry ? userScheduledEntry[1] : null;

  // Nome exato que está registrado na escala para evitar criar chaves duplicadas
  const targetScheduledName = userScheduledEntry ? userScheduledEntry[0] : userName;

  // Músicos escalados no próximo culto (deduplicados)
  const scheduledMembers = Object.keys(upcomingConfirmed);

  // Músicas do próximo culto
  const eventSongs = upcomingEvent
    ? (getEventSongItems(upcomingEvent).map(item => resolveEventSong(item, songs)).filter(Boolean) as Song[])
    : [];

  // Função/instrumento do usuário
  const userMemberData = members.find(m => isSamePersonName(m.name, userName));
  const userRole = userMemberData?.role || 'Vocal & Instrumento';

  // Formatação de data amigável
  const formatEventDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 'Próximo domingo • 19:00';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      return `${capitalized} • ${timeStr || '19:00'}`;
    } catch {
      return `${dateStr} • ${timeStr}`;
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 animate-fade-in">
      {/* Dynamic Aura Ambient Header */}
      <div className="relative pt-2 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-md text-headline-md text-on-surface">Olá, {firstName}</span>
              <span className="material-symbols-outlined text-[20px] text-primary">waving_hand</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-label-md text-label-md text-primary tracking-wide uppercase">
                {isUserScheduled ? 'Escalado no próximo culto' : 'Ministério de Louvor'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenNotifications}
            aria-label="Notificações da escala"
            className="relative w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-tertiary"></span>
            )}
          </button>
        </div>

        {/* Card de Destaque 'Próximo Culto' (Beacon Style) */}
        {upcomingEvent ? (
          <div className="relative rounded-2xl bg-surface-container-high border border-outline-variant/30 shadow-xl overflow-hidden p-4 mb-5">
            {/* Illuminated glowing background beams */}
            <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary-container/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-tertiary-container/15 blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                      Próximo Culto
                    </span>
                    <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">
                      Presencial
                    </span>
                  </div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1 truncate font-extrabold">
                    {upcomingEvent.title}
                  </h2>
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                      {formatEventDate(upcomingEvent.date, upcomingEvent.time)}
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                {isUserScheduled ? (
                  userStatus === 'accepted' ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest shadow-sm border border-emerald-500/30 flex-shrink-0">
                      <span className="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
                      <span className="font-label-md text-label-md text-emerald-400 font-bold">Confirmado</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStatusChange(upcomingEvent.id, targetScheduledName, 'accepted')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-sm active:scale-95 transition-transform flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      <span>Confirmar</span>
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">Geral</span>
                  </div>
                )}
              </div>

              {/* Musician Role & Ministry Details */}
              <div className="rounded-xl bg-surface-container p-3 flex items-center justify-between shadow-inner border border-outline-variant/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">queue_music</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Sua Atuação</span>
                    <span className="font-label-lg text-label-lg text-on-surface truncate">
                      {isUserScheduled ? userRole : 'Ministério de Louvor'}
                    </span>
                  </div>
                </div>

                {/* Avatar Cluster (Stage Team) */}
                <div className="flex items-center -space-x-2 flex-shrink-0">
                  {scheduledMembers.slice(0, 3).map((mName, idx) => {
                    const mData = resolveMemberData(mName, members);
                    return (
                      <div key={idx} className="w-7 h-7 rounded-full ring-2 ring-surface overflow-hidden shadow-sm">
                        <MemberAvatar name={mName} avatarUrl={mData?.avatarUrl} size="xs" className="w-full h-full" />
                      </div>
                    );
                  })}
                  {scheduledMembers.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface ring-2 ring-surface shadow-sm">
                      +{scheduledMembers.length - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                onClick={() => onSelectEvent(upcomingEvent)}
                className="w-full h-12 rounded-xl bg-primary-container text-on-primary-container font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:bg-primary-container/90 active:scale-[0.98] transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
                <span>Ver Detalhes</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Quick Utilities Grid (Ferramentas de Palco) */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Ferramentas de Palco</h3>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Acesso Rápido</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setIsMetronomeOpen(true)}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/15 active:scale-95 transition-all shadow-sm"
              type="button"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">file_map_stack</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Metrônomo</span>
            </button>

            <button
              onClick={() => setIsTunerOpen(true)}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/15 active:scale-95 transition-all shadow-sm"
              type="button"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">graphic_eq</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Afinador</span>
            </button>

            <button
              onClick={() => onChangeTab('team')}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/15 active:scale-95 transition-all shadow-sm"
              type="button"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Escala</span>
            </button>

            <button
              onClick={() => upcomingEvent && setJustificationModalEvent(upcomingEvent)}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/15 active:scale-95 transition-all shadow-sm"
              type="button"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">event_busy</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Justificar</span>
            </button>
          </div>
        </div>

        {/* Ordem do Culto (Setlist Preview) */}
        {eventSongs.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Ordem do Culto</h3>
                <span className="font-label-sm text-label-sm bg-surface-container-highest text-secondary px-2 py-0.5 rounded-full">
                  {eventSongs.length} músicas
                </span>
              </div>
              <button
                onClick={() => onChangeTab('playlist')}
                className="font-label-md text-label-md text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Repertório</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {eventSongs.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="group flex items-center justify-between p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all shadow-sm border border-outline-variant/15"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-label-md text-label-md font-extrabold flex-shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                        {s.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-label-md text-label-md font-bold px-1.5 py-0.5 rounded bg-primary-container/20 text-primary">
                          Tom: {s.key || 'G'}
                        </span>
                        {s.bpm && (
                          <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px] text-outline">speed</span>
                            {s.bpm} BPM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onOpenStageSong(s)}
                      aria-label={`Visualizar cifra de ${s.title}`}
                      className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface-variant active:scale-95 transition-all"
                      title="Cifra ao Vivo no Palco"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    </button>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Reproduzir guia de ${s.title}`}
                        className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-primary active:scale-95 transition-all"
                        title="Ver vídeo no YouTube"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mural da Equipe */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Mural da Equipe</h3>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                {notices.length} {notices.length === 1 ? 'Aviso' : 'Avisos'}
              </span>
            </div>
            {isLeaderOrAdmin && onSaveNotice && (
              <button
                onClick={() => {
                  setNoticeToEdit(null);
                  setIsNoticeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-label-md text-label-md font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus size={16} />
                <span>Novo Aviso</span>
              </button>
            )}
          </div>

          {notices.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-high border border-outline-variant/20 p-6 text-center shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <span className="material-symbols-outlined text-[26px]">campaign</span>
              </div>
              <p className="font-title-sm text-title-sm text-on-surface font-bold">Nenhum aviso no momento</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {isLeaderOrAdmin 
                  ? 'Publique comunicados e lembretes para os integrantes do louvor.'
                  : 'Fique atento aos próximos avisos e orientações da liderança.'}
              </p>
              {isLeaderOrAdmin && onSaveNotice && (
                <button
                  onClick={() => {
                    setNoticeToEdit(null);
                    setIsNoticeModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all shadow-md"
                >
                  <Plus size={16} />
                  <span>Publicar Primeiro Aviso</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map(notice => {
                const cat = CATEGORY_MAP[notice.category] || CATEGORY_MAP.geral;
                const formattedTime = formatNoticeDate(notice.createdAt);

                return (
                  <div
                    key={notice.id}
                    className="relative overflow-hidden rounded-2xl bg-surface-container-high border border-outline-variant/20 p-4 shadow-md transition-all hover:border-outline-variant/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        {/* Topo do Card: Categoria, Pin e Ações do Líder */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold break-words">
                              {notice.title}
                            </span>
                            {notice.pinned && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-label-sm text-[10px] font-bold">
                                <Pin size={10} className="fill-amber-400" />
                                Fixado
                              </span>
                            )}
                            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-md bg-surface-variant text-on-surface-variant font-medium text-[10px]">
                              {cat.label}
                            </span>
                          </div>

                          {isLeaderOrAdmin && (
                            <div className="flex items-center gap-1 shrink-0 -mr-1">
                              {onTogglePinNotice && (
                                <button
                                  onClick={() => onTogglePinNotice(notice.id, notice.pinned)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    notice.pinned 
                                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                                      : 'text-on-surface-variant hover:bg-surface-variant'
                                  }`}
                                  title={notice.pinned ? 'Desafixar aviso' : 'Fixar no topo'}
                                >
                                  <Pin size={15} />
                                </button>
                              )}
                              {onSaveNotice && (
                                <button
                                  onClick={() => {
                                    setNoticeToEdit(notice);
                                    setIsNoticeModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
                                  title="Editar aviso"
                                >
                                  <Edit2 size={15} />
                                </button>
                              )}
                              {onDeleteNotice && (
                                <button
                                  onClick={() => setNoticeToDelete(notice)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Excluir aviso"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mensagem do Aviso */}
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed whitespace-pre-line">
                          {notice.message}
                        </p>

                        {/* Lembrete de Destaque / Soundcheck */}
                        {notice.highlightText && (
                          <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-primary-container/20 border border-primary/20 text-primary">
                            <span className="material-symbols-outlined text-[18px]">alarm</span>
                            <span className="font-label-md text-label-md font-bold">{notice.highlightText}</span>
                          </div>
                        )}

                        {/* Rodapé: Autor/Data e Botão do WhatsApp */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-outline-variant/15">
                          <span className="font-label-sm text-[11px] text-on-surface-variant">
                            {notice.authorName ? `Por ${notice.authorName}` : ''}
                            {formattedTime ? ` • ${formattedTime}` : ''}
                          </span>

                          <button
                            onClick={() => {
                              const waUrl = createShareNoticeWhatsAppLink(notice);
                              window.open(waUrl, '_blank');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-label-md text-xs font-bold shadow-md shadow-emerald-950/20 active:scale-95 transition-all ml-auto"
                            title="Enviar ou compartilhar este aviso no WhatsApp"
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais de Ferramentas */}
      <MetronomeModal
        isOpen={isMetronomeOpen}
        onClose={() => setIsMetronomeOpen(false)}
        initialBpm={eventSongs[0]?.bpm || 70}
      />

      <TunerModal
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
      />

      {isNoticeModalOpen && onSaveNotice && (
        <NoticeModal
          isOpen={isNoticeModalOpen}
          onClose={() => {
            setIsNoticeModalOpen(false);
            setNoticeToEdit(null);
          }}
          onSave={onSaveNotice}
          onDelete={onDeleteNotice}
          noticeToEdit={noticeToEdit}
          currentUserName={userName}
        />
      )}

      {justificationModalEvent && (
        <JustificationModal
          isOpen={Boolean(justificationModalEvent)}
          onClose={() => setJustificationModalEvent(null)}
          memberName={userName}
          onConfirm={(reason) => {
            const targetMemberName = justificationModalEvent.confirmed
              ? Object.keys(justificationModalEvent.confirmed).find(k => isSamePersonName(k, userName)) || userName
              : userName;
            onStatusChange(justificationModalEvent.id, targetMemberName, 'declined', reason);
            setJustificationModalEvent(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(noticeToDelete)}
        title="Excluir Aviso"
        message={`Deseja realmente excluir o aviso "${noticeToDelete?.title}" do mural? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        onConfirm={() => {
          if (noticeToDelete && onDeleteNotice) {
            onDeleteNotice(noticeToDelete.id);
            setNoticeToDelete(null);
          }
        }}
        onCancel={() => setNoticeToDelete(null)}
      />
    </div>
  );
};
