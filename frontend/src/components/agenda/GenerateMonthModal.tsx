import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Calendar, Wand2 } from 'lucide-react';
import { WorshipEvent } from '../../types';
import { generateEventsForMonth } from '../../utils/agendaGenerator';

interface GenerateMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEvents: WorshipEvent[];
  onGenerate: (events: Omit<WorshipEvent, 'id'>[]) => Promise<void>;
}

export const GenerateMonthModal: React.FC<GenerateMonthModalProps> = ({
  isOpen,
  onClose,
  existingEvents,
  onGenerate
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedMonth) return;

    try {
      setIsGenerating(true);
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1-indexed

      const newEvents = generateEventsForMonth(year, month, existingEvents);

      if (newEvents.length === 0) {
        alert('Nenhum evento novo para gerar. Talvez a agenda deste mês já esteja completa?');
        setIsGenerating(false);
        return;
      }

      await onGenerate(newEvents);
      
      // Reseta e fecha o modal
      setSelectedMonth('');
      onClose();
    } catch (error) {
      console.error('Erro ao gerar eventos:', error);
      alert('Erro ao gerar os eventos. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Gerar Agenda do Mês"
      subtitle="Cria automaticamente todos os cultos fixos e ensaios"
    >
      <div className="space-y-4 text-left">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <p className="text-sm text-slate-300 mb-3">
            O sistema gerará automaticamente:
            <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-400 text-xs">
              <li>Terças (20:00) - Culto de Oração</li>
              <li>Quintas (20:00) - Culto de Ensinamento</li>
              <li>Sextas (20:00) - Ensaio</li>
              <li>Sábados (19:30) - Culto Departamental (exceto 2º sábado)</li>
              <li>1º Domingo (08:30) - Santa Ceia</li>
              <li>Outros Domingos (18:30) - Culto com a Família</li>
            </ul>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-200 ml-1">Mês e Ano</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar size={18} className="text-slate-400" />
            </div>
            <input
              type="month"
              required
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            fullWidth
            onClick={handleGenerate}
            disabled={!selectedMonth || isGenerating}
            isLoading={isGenerating}
            icon={<Wand2 size={18} />}
          >
            Gerar Eventos
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
