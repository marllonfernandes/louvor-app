import React, { useState } from 'react';
import { WorshipEvent, Song, Member, Team } from '../../types';
import { StatCard } from './StatCard';
import { TopSongsChart } from './TopSongsChart';
import { TopMembersRank } from './TopMembersRank';
import { KeysDistribution } from './KeysDistribution';
import { Calendar, CheckCircle, Disc3, Users, TrendingUp, Sparkles } from 'lucide-react';

interface MetricsViewProps {
  events: WorshipEvent[];
  songs: Song[];
  members: Member[];
  teams: Team[];
  onSelectSong?: (song: Song) => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  events,
  songs,
  members,
  teams,
  onSelectSong
}) => {
  // Cálculo de KPIs gerais
  const totalEvents = events.length;

  let totalConfirmed = 0;
  let totalScheduled = 0;

  events.forEach(e => {
    Object.values(e.confirmed || {}).forEach(status => {
      totalScheduled++;
      if (status === 'accepted') totalConfirmed++;
    });
  });

  const attendanceRate = totalScheduled > 0 ? Math.round((totalConfirmed / totalScheduled) * 100) : 100;
  const avgMembersPerEvent = totalEvents > 0 ? (totalScheduled / totalEvents).toFixed(1) : '0';

  return (
    <div className="space-y-4 text-left">
      {/* Topo com Título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <span>Indicadores & Métricas</span>
            <span className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
              <TrendingUp size={14} />
            </span>
          </h2>
          <p className="text-xs text-slate-400">Análise de assiduidade, repertório e escalas</p>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          title="Taxa de Presença"
          value={`${attendanceRate}%`}
          subtitle={`${totalConfirmed} presenças confirmadas`}
          icon={<CheckCircle size={18} />}
          variant="blue"
          trend="Equipe Engajada"
        />

        <StatCard
          title="Total de Eventos"
          value={totalEvents}
          subtitle={`Média ${avgMembersPerEvent} por escala`}
          icon={<Calendar size={18} />}
          variant="cyan"
          trend="Escalas Ativas"
        />

        <StatCard
          title="Repertório Ativo"
          value={songs.length}
          subtitle="Músicas cadastradas"
          icon={<Disc3 size={18} />}
          variant="amber"
        />

        <StatCard
          title="Músicos & Equipe"
          value={members.length}
          subtitle={`${teams.length} times formados`}
          icon={<Users size={18} />}
          variant="purple"
        />
      </div>

      {/* Ranking de Músicos e Vocais (Filtro por Categorias) */}
      <TopMembersRank events={events} members={members} />

      {/* Músicas Mais Tocadas */}
      <TopSongsChart events={events} songs={songs} onSelectSong={onSelectSong} />

      {/* Distribuição de Tons e Estilos */}
      <KeysDistribution songs={songs} events={events} />
    </div>
  );
};
