import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Calendar, Wand2, Clock, Check, CheckCheck } from 'lucide-react';
import { WorshipEvent } from '../../types';
import { generateEventsForMonth } from '../../utils/agendaGenerator';
import { getEventTypeDefinition } from '../../utils/eventType';
import { appLogger } from '../../utils/logger';

interface GenerateMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEvents: WorshipEvent[];
  onGenerate: (events: Omit<WorshipEvent, 'id'>[]) => Promise<void>;
}

interface SelectableCandidate extends Omit<WorshipEvent, 'id'> {
  tempId: string;
  selected: boolean;
}

const getDefaultMonth = () => {
  const now = new Date();
  const target = now.getDate() > 20
    ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
    : now;
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatEventDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const formatted = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
};

export const GenerateMonthModal: React.FC<GenerateMonthModalProps> = ({
  isOpen,
  onClose,
  existingEvents,
  onGenerate
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultMonth());
  const [candidates, setCandidates] = useState<SelectableCandidate[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Recalcular eventos candidatos quando o mês ou existingEvents mudarem
  useEffect(() => {
    if (!isOpen || !selectedMonth) {
      setCandidates([]);
      return;
    }

    try {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const generated = generateEventsForMonth(year, month, existingEvents);
      setCandidates(
        generated.map((ev, idx) => ({
          ...ev,
          tempId: `${ev.date}_${ev.title}_${idx}`,
          selected: true
        }))
      );
      setFilterType('all');
    } catch {
      setCandidates([]);
    }
  }, [isOpen, selectedMonth, existingEvents]);

  const selectedCount = candidates.filter(c => c.selected).length;

  const handleToggleCandidate = (tempId: string) => {
    setCandidates(prev => prev.map(c => c.tempId === tempId ? { ...c, selected: !c.selected } : c));
  };

  const handleToggleAll = (select: boolean) => {
    setCandidates(prev => prev.map(c => ({ ...c, selected: select })));
  };

  const handleGenerate = async () => {
    const selectedEvents = candidates.filter(c => c.selected);
    if (selectedEvents.length === 0) return;

    try {
      setIsGenerating(true);
      const eventsToCreate: Omit<WorshipEvent, 'id'>[] = selectedEvents.map(({ tempId, selected, ...ev }) => ev);

      await onGenerate(eventsToCreate);
      onClose();
    } catch (error) {
      appLogger.error('SISTEMA', 'Erro ao gerar eventos do mês', error);
      alert('Erro ao gerar os eventos. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayedCandidates = candidates.filter(cand => {
    if (filterType === 'all') return true;
    return cand.type === filterType;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Gerar Agenda do Mês"
      subtitle="Escolha o mês e selecione quais cultos e ensaios deseja criar"
      maxHeight="max-h-[92vh]"
    >
      <div className="space-y-4 text-left">
        {/* Seletor de Mês e Ano */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 ml-0.5">Mês e Ano de Referência</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar size={16} className="text-blue-400" />
            </div>
            <input
              type="month"
              required
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>
        </div>

        {/* Informação sobre os Padrões da Igreja */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 font-semibold">Cultos programados:</strong> Terças (Oração), Quintas (Ensino), Sextas (Ensaio), Sábados (Deptos), 1º Domingo (Santa Ceia) e outros Domingos (Família).
          </p>
        </div>

        {/* Lista Vazia (Já cadastrados) */}
        {selectedMonth && candidates.length === 0 && (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <CheckCheck size={20} />
            </div>
            <p className="text-xs font-bold text-slate-200">
              Nenhum novo evento disponível para este mês
            </p>
            <p className="text-[11px] text-slate-400">
              Todos os cultos e ensaios padrões de {selectedMonth} já estão criados na agenda.
            </p>
          </div>
        )}

        {/* Lista de Eventos Selecionáveis */}
        {candidates.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {/* Barra de Controle de Seleção */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {selectedCount} de {candidates.length} eventos selecionados
                </p>
                <p className="text-[11px] text-slate-400">
                  Marque apenas os cultos e ensaios que deseja gerar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAll(true)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  Marcar Todos
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => handleToggleAll(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            {/* Chips Rápidos de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: `Todos (${candidates.length})` },
                { id: 'culto', label: `Cultos (${candidates.filter(c => c.type === 'culto').length})` },
                { id: 'ensaio', label: `Ensaios (${candidates.filter(c => c.type === 'ensaio').length})` },
                { id: 'ceia', label: `Santa Ceia (${candidates.filter(c => c.type === 'ceia').length})` }
              ].filter(chip => chip.id === 'all' || !chip.label.includes('(0)')).map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilterType(chip.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    filterType === chip.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Lista dos Eventos Candidatos com Scroll */}
            <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain pr-1">
              {displayedCandidates.map(cand => {
                const typeDef = getEventTypeDefinition(cand.type);
                return (
                  <div
                    key={cand.tempId}
                    onClick={() => handleToggleCandidate(cand.tempId)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      cand.selected
                        ? 'bg-slate-800/90 border-blue-500/40 text-slate-100 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                          cand.selected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}
                      >
                        {cand.selected && <Check size={13} className="stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-100">
                            {cand.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeDef.badgeClass}`}>
                            <typeDef.icon size={11} className="shrink-0" />
                            {typeDef.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300">
                          <span className="inline-flex items-center gap-1 text-blue-400 font-semibold">
                            <Calendar size={13} />
                            {formatEventDate(cand.date)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                            <Clock size={13} />
                            {cand.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rodapé com Ações */}
        <div className="pt-3 border-t border-slate-800 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleGenerate}
            disabled={selectedCount === 0 || isGenerating}
            isLoading={isGenerating}
            icon={<Wand2 size={16} />}
          >
            Gerar {selectedCount} Evento{selectedCount === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
