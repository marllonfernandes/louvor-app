import React, { useState } from 'react';
import { WorshipEvent, Song, Member, ConfirmationStatus, TabType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { resolveEventSong, getEventSongItems } from '../../utils/worshipEvent';
import { isSamePersonName, resolveMemberData } from '../../utils/avatar';
import { MemberAvatar } from '../ui/MemberAvatar';
import { MetronomeModal } from '../stage/MetronomeModal';
import { TunerModal } from '../stage/TunerModal';
import { JustificationModal } from '../agenda/JustificationModal';

interface HomeViewProps {
  events: WorshipEvent[];
  songs: Song[];
  members: Member[];
  onSelectEvent: (event: WorshipEvent) => void;
  onSelectSong: (song: Song) => void;
  onOpenStageSong: (song: Song) => void;
  onStatusChange: (eventId: string, memberName: string, status: ConfirmationStatus, justification?: string) => void;
  onChangeTab: (tab: TabType) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  songs,
  members,
  onSelectEvent,
  onOpenStageSong,
  onStatusChange,
  onChangeTab,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) => {
  const { userProfile, currentUser } = useAuth();
  const userName = userProfile?.name || currentUser?.displayName || 'Músico';
  const firstName = userName.split(' ')[0];

  const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [justificationModalEvent, setJustificationModalEvent] = useState<WorshipEvent | null>(null);

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

  // Escalação e status do usuário
  const userScheduledEntry = upcomingEvent?.confirmed
    ? Object.entries(upcomingEvent.confirmed).find(([name]) => isSamePersonName(name, userName))
    : null;

  const isUserScheduled = Boolean(userScheduledEntry);
  const userStatus = userScheduledEntry ? userScheduledEntry[1] : null;

  // Músicos escalados no próximo culto
  const scheduledMembers = upcomingEvent?.confirmed ? Object.keys(upcomingEvent.confirmed) : [];

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
                      onClick={() => onStatusChange(upcomingEvent.id, userName, 'accepted')}
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
                <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                <span>Ver Ordem do Culto</span>
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
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-error shadow-sm">
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
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Mural da Equipe</h3>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">1 Aviso</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-surface-container-high border border-outline-variant/20 p-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">campaign</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">Ensaio Geral da Semana</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Aviso</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                  {upcomingEvent?.notes ? (
                    upcomingEvent.notes
                  ) : (
                    <>
                      Ensaio confirmado para <strong className="text-on-surface font-semibold">quinta-feira às 20h00</strong> no templo principal. Por favor, cheguem com 15 minutos de antecedência para alinhamento de palco e passagem de som.
                    </>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-outline-variant/15">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[16px]">alarm</span>
                    <span className="font-label-md text-label-md font-bold">Pontualidade no soundcheck</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {justificationModalEvent && (
        <JustificationModal
          isOpen={Boolean(justificationModalEvent)}
          onClose={() => setJustificationModalEvent(null)}
          memberName={userName}
          onConfirm={(reason) => {
            onStatusChange(justificationModalEvent.id, userName, 'declined', reason);
            setJustificationModalEvent(null);
          }}
        />
      )}
    </div>
  );
};
