import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, History } from 'lucide-react';
import { WorshipEvent, ConfirmationStatus, Song, Member, Team } from '../../types';
import { EventCard } from './EventCard';
import { HeroEventCard } from '../patterns/HeroEventCard';
import { EventDetailModal } from './EventDetailModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { AddEventBottomSheet } from './AddEventBottomSheet';
import { GenerateMonthModal } from './GenerateMonthModal';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface AgendaViewProps {
  events: WorshipEvent[];
  songs: Song[];
  members: Member[];
  teams: Team[];
  onStatusChange: (eventId: string, memberName: string, status: ConfirmationStatus, justification?: string) => void;
  onSaveEvent: (event: Omit<WorshipEvent, 'id'> & { id?: string }) => void;
  onBatchSaveEvents: (events: Omit<WorshipEvent, 'id'>[]) => Promise<void>;
  onDeleteEvent: (eventId: string) => void;
  onSelectSong: (song: Song) => void;
  selectedEventFromNotification?: WorshipEvent | null;
  onClearSelectedEventFromNotification?: () => void;
}

type TimelineTab = 'upcoming' | 'past';

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  songs,
  members,
  teams,
  onStatusChange,
  onSaveEvent,
  onBatchSaveEvents,
  onDeleteEvent,
  onSelectSong,
  selectedEventFromNotification,
  onClearSelectedEventFromNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [timelineTab, setTimelineTab] = useState<TimelineTab>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<WorshipEvent | null>(null);
  const [shareEvent, setShareEvent] = useState<WorshipEvent | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<WorshipEvent | null>(null);

  useEffect(() => {
    if (selectedEventFromNotification) {
      setSelectedEvent(selectedEventFromNotification);
      onClearSelectedEventFromNotification?.();
    }
  }, [selectedEventFromNotification, onClearSelectedEventFromNotification]);

  const { userProfile } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  // Determina se o evento já passou
  const isEventPast = (ev: WorshipEvent) => {
    try {
      const [y, m, d] = ev.date.split('-').map(Number);
      const [hh, mm] = (ev.time || '23:59').split(':').map(Number);
      const eventDate = new Date(y, m - 1, d, hh, mm);
      const now = new Date();
      return eventDate.getTime() < now.getTime();
    } catch {
      return false;
    }
  };

  const upcomingEvents = events
    .filter(ev => !isEventPast(ev))
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

  const pastEvents = events
    .filter(ev => isEventPast(ev))
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());

  const activeEventsList = timelineTab === 'upcoming' ? upcomingEvents : pastEvents;

  // Extrair meses únicos para o filtro (formato YYYY-MM)
  const uniqueMonths = Array.from(
    new Set(activeEventsList.map(ev => ev.date.substring(0, 7)))
  ).sort();

  const filteredEvents = activeEventsList.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.team && ev.team.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || ev.type === filterType;
    const matchesMonth = filterMonth === 'all' || ev.date.startsWith(filterMonth);
    
    return matchesSearch && matchesType && matchesMonth;
  });

  const handleOpenCreateEvent = () => {
    setEventToEdit(null);
    setIsAddOpen(true);
  };

  const handleOpenEditEvent = (event: WorshipEvent) => {
    setSelectedEvent(null);
    setEventToEdit(event);
    setIsAddOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddOpen(false);
    setEventToEdit(null);
  };

  const handleCloseGenerateModal = () => {
    setIsGenerateOpen(false);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Topo com proporções ajustadas */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight truncate">Escalas</h2>
          <p className="text-xs text-slate-400 truncate">Cultos, ensaios e presença</p>
        </div>
        {isLeader && (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsGenerateOpen(true)}
              size="sm"
              variant="secondary"
              className="flex-shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs sm:text-sm"
            >
              Gerar Mês
            </Button>
            <Button
              onClick={handleOpenCreateEvent}
              size="sm"
              className="flex-shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs sm:text-sm"
              icon={<Plus size={16} />}
            >
              Novo Evento
            </Button>
          </div>
        )}
      </div>

      {/* Segmented Control: Próximos vs Realizados */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <button
          onClick={() => setTimelineTab('upcoming')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] ${
            timelineTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar size={15} />
          <span>Próximos ({upcomingEvents.length})</span>
        </button>

        <button
          onClick={() => setTimelineTab('past')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] ${
            timelineTab === 'past'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <History size={15} />
          <span>Realizados ({pastEvents.length})</span>
        </button>
      </div>

      {/* Barra de Busca e Filtros Rápidos */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por evento ou equipe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        {/* Chips de Filtro */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'congresso', label: 'Congressos' },
            { id: 'culto', label: 'Cultos' },
            { id: 'ensaio', label: 'Ensaios' },
            { id: 'jovens', label: 'Jovens' },
            { id: 'ceia', label: 'Santa Ceia' },
            { id: 'batismo', label: 'Batismo' },
            { id: 'especial', label: 'Especiais' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro de Mês */}
        {uniqueMonths.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mt-2">
            <button
              onClick={() => setFilterMonth('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterMonth === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              Todos os Meses
            </button>
            {uniqueMonths.map(monthStr => {
              const [year, month] = monthStr.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
              
              return (
                <button
                  key={monthStr}
                  onClick={() => setFilterMonth(monthStr)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all capitalize ${
                    filterMonth === monthStr
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Eventos Despoluída */}
      {filteredEvents.length === 0 ? (
        activeEventsList.length === 0 ? (
          <EmptyState
            icon={timelineTab === 'upcoming' ? Calendar : History}
            title={timelineTab === 'upcoming' ? 'Nenhuma escala agendada' : 'Nenhum evento no histórico'}
            description={
              timelineTab === 'upcoming'
                ? 'Crie uma nova escala para o ministério de louvor.'
                : 'Os eventos realizados aparecerão aqui.'
            }
            actionText={timelineTab === 'upcoming' && isLeader ? 'Criar Nova Escala' : undefined}
            onAction={timelineTab === 'upcoming' && isLeader ? handleOpenCreateEvent : undefined}
            actionIcon={<Plus size={16} />}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nenhum evento encontrado"
            description="Nenhum evento corresponde à pesquisa ou aos filtros selecionados."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterMonth('all');
            }}
          />
        )
      ) : (
        <div className="space-y-3">
          {/* Se estiver na aba Próximos e sem filtros ativos, destaca o mais iminente no HeroEventCard */}
          {timelineTab === 'upcoming' && !searchTerm && filterType === 'all' && filterMonth === 'all' ? (
            <>
              <HeroEventCard
                event={filteredEvents[0]}
                songs={songs}
                members={members}
                onSelectEvent={setSelectedEvent}
                onShareWhatsApp={setShareEvent}
                onStatusChange={onStatusChange}
                currentUserName={userProfile?.name}
              />

              {filteredEvents.length > 1 && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Demais Escalas Agendadas ({filteredEvents.length - 1})
                    </h3>
                  </div>

                  {filteredEvents.slice(1).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      songs={songs}
                      members={members}
                      onStatusChange={onStatusChange}
                      onSelectEvent={setSelectedEvent}
                      onShareWhatsApp={setShareEvent}
                      isPast={false}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                songs={songs}
                members={members}
                onStatusChange={onStatusChange}
                onSelectEvent={setSelectedEvent}
                onShareWhatsApp={setShareEvent}
                isPast={timelineTab === 'past'}
              />
            ))
          )}
        </div>
      )}

      {/* Modais e Painéis de Tela Inteira */}
      <AddEventBottomSheet
        isOpen={isAddOpen}
        onClose={handleCloseAddModal}
        teams={teams}
        songs={songs}
        members={members}
        onSaveEvent={onSaveEvent}
        eventToEdit={eventToEdit}
      />

      <EventDetailModal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent ? (events.find(e => e.id === selectedEvent.id) || selectedEvent) : null}
        songs={songs}
        members={members}
        onStatusChange={onStatusChange}
        onDeleteEvent={onDeleteEvent}
        onShareWhatsApp={setShareEvent}
        onSelectSong={onSelectSong}
        onEditEvent={handleOpenEditEvent}
        onSaveEvent={onSaveEvent}
      />

      <WhatsAppShareModal
        isOpen={Boolean(shareEvent)}
        onClose={() => setShareEvent(null)}
        event={shareEvent ? (events.find(e => e.id === shareEvent.id) || shareEvent) : null}
        songs={songs}
        members={members}
      />

      <GenerateMonthModal
        isOpen={isGenerateOpen}
        onClose={handleCloseGenerateModal}
        existingEvents={events}
        onGenerate={onBatchSaveEvents}
      />
    </div>
  );
};
