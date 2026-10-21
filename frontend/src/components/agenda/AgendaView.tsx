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
import { getEventCalendarBadge } from '../../utils/eventType';
import { formatDateBR } from '../../utils/worshipEvent';

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
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month'>('week');
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

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

  const eventTypeLabels: Record<string, string> = {
    all: 'Todos',
    culto: 'Cultos',
    ceia: 'Santa Ceia',
    ensaio: 'Ensaios',
    jovens: 'Jovens',
    congresso: 'Congressos',
    batismo: 'Batismo',
    especial: 'Especiais'
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
  };

  const isCustomTypeActive = filterType !== 'all' && !['culto', 'ceia'].includes(filterType);
  const isMonthActive = filterMonth !== 'all';
  const activeExtraFiltersCount = (isCustomTypeActive ? 1 : 0) + (isMonthActive ? 1 : 0);

  // Navegação de mês no calendário
  const handlePrevMonth = () => {
    setCalendarMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleCurrentMonth = () => {
    setCalendarMonthDate(new Date());
  };

  // Dias para visão semanal (próximos 7 dias a partir de hoje)
  const weekCalendarDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayNum = d.getDate().toString().padStart(2, '0');
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).toUpperCase();
    const isToday = i === 0;

    return {
      dateStr,
      dayNum,
      dayName,
      isToday
    };
  });

  // Dias para visão mensal completa
  const monthCalendarDays = (() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Preenchimento dos dias finais do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, day);
      const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNum: String(day).padStart(2, '0'),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Dias do mês atual
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= totalDays; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNum: String(day).padStart(2, '0'),
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Preenchimento dos dias iniciais do próximo mês para fechar semanas completas (múltiplos de 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNum: String(day).padStart(2, '0'),
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  })();

  const filteredEvents = activeEventsList.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.team && ev.team.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || ev.type === filterType;
    const matchesMonth = filterMonth === 'all' || ev.date.startsWith(filterMonth);
    const matchesCalendarDate = !selectedCalendarDate || ev.date === selectedCalendarDate;
    
    return matchesSearch && matchesType && matchesMonth && matchesCalendarDate;
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
    <div className="space-y-4 text-left animate-fade-in">
      {/* Topo com proporções e botões no estilo Sanctuary Slate */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate font-extrabold">
            Agenda de Cultos
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            Escalas, liturgias e presenças
          </p>
        </div>
        {isLeader && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="flex-shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-label-md font-bold bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/30 active:scale-95 transition-all shadow-sm"
            >
              Gerar Mês
            </button>
            <button
              onClick={handleOpenCreateEvent}
              className="flex-shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-label-md font-bold bg-primary-container text-on-primary-container hover:bg-primary-container/90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Novo Culto</span>
            </button>
          </div>
        )}
      </div>

      {/* Segmented Control: Próximos vs Realizados */}
      <div className="grid grid-cols-2 p-1 bg-surface-container rounded-2xl border border-outline-variant/20 shadow-inner">
        <button
          onClick={() => setTimelineTab('upcoming')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[42px] ${
            timelineTab === 'upcoming'
              ? 'bg-primary-container text-on-primary-container shadow-md'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>Próximos ({upcomingEvents.length})</span>
        </button>

        <button
          onClick={() => setTimelineTab('past')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[42px] ${
            timelineTab === 'past'
              ? 'bg-primary-container text-on-primary-container shadow-md'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>Realizados ({pastEvents.length})</span>
        </button>
      </div>

      {/* Calendário Inteligente com Alternância Semana / Mês e Ícones Litúrgicos */}
      <div className="rounded-2xl bg-surface-container-lowest p-3 border border-outline-variant/20 shadow-md space-y-2">
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          {calendarViewMode === 'week' ? (
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">view_week</span>
              <span>Visão da Semana</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Mês anterior"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="font-headline-sm text-sm text-on-surface font-bold capitalize">
                {calendarMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Próximo mês"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Alternador Semana / Mês */}
          <div className="flex p-0.5 bg-surface-container rounded-xl border border-outline-variant/20">
            <button
              type="button"
              onClick={() => setCalendarViewMode('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                calendarViewMode === 'week'
                  ? 'bg-primary-container text-on-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setCalendarViewMode('month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                calendarViewMode === 'month'
                  ? 'bg-primary-container text-on-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {/* Legenda de Ícones Litúrgicos */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[10px] text-on-surface-variant px-1 pb-1">
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px] text-primary">church</span> Culto
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px] text-blue-500">diversity_3</span> Família
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px] text-amber-500">headphones</span> Ensaio
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px] text-rose-500">wine_bar</span> Ceia
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px] text-emerald-500">local_fire_department</span> Jovens
          </span>
        </div>

        {/* VISUALIZAÇÃO: SEMANA (Próximos 7 dias) */}
        {calendarViewMode === 'week' && (
          <div className="grid grid-cols-7 gap-1">
            {weekCalendarDays.map((day) => {
              const dayEvents = events.filter(e => e.date === day.dateStr);
              const badges = dayEvents.map(e => getEventCalendarBadge(e));
              const isSelected = selectedCalendarDate === day.dateStr;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedCalendarDate(isSelected ? null : day.dateStr);
                    }
                  }}
                  className={`flex flex-col items-center py-2 px-0.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container ring-2 ring-primary shadow-sm font-bold'
                      : day.isToday
                      ? 'bg-surface-container border border-primary/40 font-bold'
                      : dayEvents.length > 0
                      ? 'bg-surface-container hover:bg-surface-container-high'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                  title={dayEvents.length > 0 ? `${dayEvents.length} evento(s) no dia ${day.dayNum}` : undefined}
                >
                  <span className={`font-label-sm text-[10px] ${isSelected ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    {day.dayName}
                  </span>
                  <span className="font-headline-sm text-sm text-on-surface my-0.5 font-bold">
                    {day.dayNum}
                  </span>
                  <div className="flex items-center justify-center gap-0.5 min-h-[14px]">
                    {badges.slice(0, 2).map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className={`material-symbols-outlined text-[13px] ${isSelected ? 'text-on-primary-container' : badge.colorClass}`}
                      >
                        {badge.icon}
                      </span>
                    ))}
                    {badges.length > 2 && (
                      <span className="text-[8px] font-black opacity-80">+{badges.length - 2}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* VISUALIZAÇÃO: MÊS COMPLETO */}
        {calendarViewMode === 'month' && (
          <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1 text-center font-label-sm text-[10px] text-on-surface-variant font-bold pb-0.5">
              <span>DOM</span>
              <span>SEG</span>
              <span>TER</span>
              <span>QUA</span>
              <span>QUI</span>
              <span>SEX</span>
              <span>SÁB</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCalendarDays.map((day, dIdx) => {
                const dayEvents = events.filter(e => e.date === day.dateStr);
                const badges = dayEvents.map(e => getEventCalendarBadge(e));
                const isSelected = selectedCalendarDate === day.dateStr;

                return (
                  <button
                    key={`${day.dateStr}-${dIdx}`}
                    type="button"
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedCalendarDate(isSelected ? null : day.dateStr);
                      }
                    }}
                    className={`flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer min-h-[46px] justify-between ${
                      !day.isCurrentMonth
                        ? 'opacity-25 pointer-events-none'
                        : isSelected
                        ? 'bg-primary-container text-on-primary-container ring-2 ring-primary shadow-sm font-bold'
                        : day.isToday
                        ? 'bg-surface-container border border-primary/40 font-bold'
                        : dayEvents.length > 0
                        ? 'bg-surface-container hover:bg-surface-container-high'
                        : 'hover:bg-surface-container/40 text-on-surface-variant'
                    }`}
                    title={dayEvents.length > 0 ? `${dayEvents.length} evento(s) em ${day.dateStr}` : undefined}
                  >
                    <span className={`font-headline-sm text-xs font-bold ${isSelected ? 'text-on-primary-container' : 'text-on-surface'}`}>
                      {day.dayNum}
                    </span>
                    <div className="flex items-center justify-center gap-0.5 min-h-[14px]">
                      {badges.slice(0, 2).map((badge, bIdx) => (
                        <span
                          key={bIdx}
                          className={`material-symbols-outlined text-[13px] ${isSelected ? 'text-on-primary-container' : badge.colorClass}`}
                        >
                          {badge.icon}
                        </span>
                      ))}
                      {badges.length > 2 && (
                        <span className="text-[8px] font-black opacity-80">+{badges.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Indicador de Filtro Ativo por Dia Selecionado */}
        {selectedCalendarDate && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-primary-container/20 border border-primary/30 text-xs font-bold text-on-surface pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">event</span>
              <span>Filtrando por: {formatDateBR(selectedCalendarDate)}</span>
              <span className="text-on-surface-variant text-[11px]">
                ({events.filter(e => e.date === selectedCalendarDate).length} evento{events.filter(e => e.date === selectedCalendarDate).length === 1 ? '' : 's'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-primary hover:underline text-[11px] cursor-pointer flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>Ver todos</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra de Busca e Filtros Rápidos */}
      <div className="space-y-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por evento ou equipe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary shadow-inner"
          />
        </div>

        {/* Faixa de Filtros Clean: 3 Filtros Rápidos + Menu +Filtros (Sem rolagem lateral) */}
        <div className="relative">
          <div className="flex items-center gap-1.5 flex-wrap py-0.5">
            {/* 1. Todos */}
            <button
              type="button"
              onClick={() => {
                setFilterType('all');
                setFilterMonth('all');
              }}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 cursor-pointer ${
                filterType === 'all' && filterMonth === 'all'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              Todos
            </button>

            {/* 2. Cultos */}
            <button
              type="button"
              onClick={() => setFilterType(filterType === 'culto' ? 'all' : 'culto')}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 cursor-pointer ${
                filterType === 'culto'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              Cultos
            </button>

            {/* 3. Santa Ceia */}
            <button
              type="button"
              onClick={() => setFilterType(filterType === 'ceia' ? 'all' : 'ceia')}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 cursor-pointer ${
                filterType === 'ceia'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              Santa Ceia
            </button>

            {/* Chip ativo se for outro tipo selecionado no menu (ex: Ensaios) */}
            {isCustomTypeActive && (
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className="px-2.5 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 bg-primary-container text-on-primary-container shadow-sm font-bold flex items-center gap-1 cursor-pointer"
                title="Remover filtro de tipo"
              >
                <span>{eventTypeLabels[filterType] || filterType}</span>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}

            {/* Chip ativo se mês selecionado */}
            {isMonthActive && (
              <button
                type="button"
                onClick={() => setFilterMonth('all')}
                className="px-2.5 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 bg-primary-container text-on-primary-container shadow-sm font-bold flex items-center gap-1 cursor-pointer capitalize"
                title="Remover filtro de mês"
              >
                <span>{formatMonthLabel(filterMonth)}</span>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}

            {/* Botão + Filtros (Menu Dropdown) */}
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 flex items-center gap-1 border cursor-pointer ${
                activeExtraFiltersCount > 0
                  ? 'bg-primary-container/20 text-primary border-primary/40 font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-outline-variant/30'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>+ Filtros</span>
              {activeExtraFiltersCount > 0 && (
                <span className="bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {activeExtraFiltersCount}
                </span>
              )}
              <span className="material-symbols-outlined text-[14px] opacity-70">
                {isFilterMenuOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          {/* Menu Dropdown de Mais Filtros */}
          {isFilterMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFilterMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-surface-container border border-outline-variant/30 rounded-2xl p-4 shadow-2xl z-50 text-left space-y-3.5 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                    <span className="font-headline-sm text-sm font-bold text-on-surface">Mais Filtros da Escala</span>
                  </div>
                  {(filterType !== 'all' || filterMonth !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterType('all');
                        setFilterMonth('all');
                      }}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Limpar tudo
                    </button>
                  )}
                </div>

                {/* Mais Tipos de Eventos */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Outros Tipos de Eventos
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'ensaio', label: 'Ensaios' },
                      { id: 'jovens', label: 'Jovens' },
                      { id: 'congresso', label: 'Congressos' },
                      { id: 'batismo', label: 'Batismo' },
                      { id: 'especial', label: 'Especiais' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setFilterType(filterType === t.id ? 'all' : t.id);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          filterType === t.id
                            ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por Mês */}
                {uniqueMonths.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                      Filtrar por Mês
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterMonth('all');
                          setIsFilterMenuOpen(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          filterMonth === 'all'
                            ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        Todos os Meses
                      </button>
                      {uniqueMonths.map(monthStr => {
                        const label = formatMonthLabel(monthStr);
                        return (
                          <button
                            key={monthStr}
                            type="button"
                            onClick={() => {
                              setFilterMonth(monthStr);
                              setIsFilterMenuOpen(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer ${
                              filterMonth === monthStr
                                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFilterMenuOpen(false)}
                    className="w-full py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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
