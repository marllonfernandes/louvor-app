import React from 'react';
import { WorshipEvent, Song, Member, Team } from '../../types';
import { StatCard } from './StatCard';
import { TopSongsChart } from './TopSongsChart';
import { TopMembersRank } from './TopMembersRank';
import { KeysDistribution } from './KeysDistribution';
import { Calendar, CheckCircle, Disc3, Users } from 'lucide-react';

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

  // Balanço Litúrgico
  const celebrationCount = songs.filter(s => s.category === 'Celebração').length;
  const adorationCount = songs.filter(s => s.category === 'Adoração').length;
  const communionCount = songs.filter(s => s.category === 'Santa Ceia').length;
  const totalCategorySongs = songs.length || 1;

  const celebrationPct = Math.round((celebrationCount / totalCategorySongs) * 100);
  const adorationPct = Math.round((adorationCount / totalCategorySongs) * 100);
  const communionPct = Math.round((communionCount / totalCategorySongs) * 100);
  const othersPct = Math.max(0, 100 - (celebrationPct + adorationPct + communionPct));

  // Alerta de fadiga de repertório
  const playCountMap = new Map<string, number>();
  events.forEach(e => {
    (e.songIds || []).forEach(id => playCountMap.set(id, (playCountMap.get(id) || 0) + 1));
  });

  let topSongName = songs[0]?.title || 'Bondade de Deus';
  let maxPlays = 0;
  playCountMap.forEach((cnt, id) => {
    if (cnt > maxPlays) {
      maxPlays = cnt;
      const found = songs.find(s => s.id === id);
      if (found) topSongName = found.title;
    }
  });

  return (
    <div className="space-y-4 text-left animate-fade-in">
      {/* Topo com Título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold flex items-center gap-2">
            <span>Indicadores do Ministério</span>
            <span className="material-symbols-outlined text-primary text-[20px]">
              leaderboard
            </span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Assiduidade, equilíbrio litúrgico e métricas
          </p>
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
          trend="Equipe Ativa"
        />

        <StatCard
          title="Cultos Realizados"
          value={totalEvents}
          subtitle={`Média ${avgMembersPerEvent} por escala`}
          icon={<Calendar size={18} />}
          variant="cyan"
          trend="No Ano"
        />

        <StatCard
          title="Repertório Ativo"
          value={songs.length}
          subtitle="Títulos cadastrados"
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

      {/* Balanço de Repertório e Liturgia (Design System Sanctuary Slate) */}
      <section className="bg-surface-container p-4 rounded-2xl flex flex-col gap-3 shadow-sm border border-outline-variant/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">donut_large</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Equilíbrio Litúrgico
            </h3>
          </div>
          <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
            {songs.length} Canções
          </span>
        </div>

        {/* Barra Multi-Segmento */}
        <div className="w-full h-3 rounded-full bg-surface-container-highest flex overflow-hidden p-0.5 gap-0.5">
          <div 
            className="bg-blue-500 h-full rounded-l-full transition-all" 
            style={{ width: `${celebrationPct || 30}%` }} 
            title={`Celebração: ${celebrationPct}%`} 
          />
          <div 
            className="bg-indigo-500 h-full transition-all" 
            style={{ width: `${adorationPct || 40}%` }} 
            title={`Adoração: ${adorationPct}%`} 
          />
          <div 
            className="bg-purple-500 h-full transition-all" 
            style={{ width: `${communionPct || 15}%` }} 
            title={`Santa Ceia: ${communionPct}%`} 
          />
          <div 
            className="bg-amber-500 h-full rounded-r-full transition-all" 
            style={{ width: `${othersPct || 15}%` }} 
            title={`Outros/Abertura: ${othersPct}%`} 
          />
        </div>

        {/* Legenda Litúrgica */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              Celebração ({celebrationPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              Adoração ({adorationPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              Santa Ceia ({communionPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              Outros/Abert. ({othersPct}%)
            </span>
          </div>
        </div>

        {/* Alerta Inteligente de Fadiga de Repertório */}
        <div className="bg-surface-container-high p-3 rounded-xl flex items-start gap-3 mt-1 border border-outline-variant/15">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Alerta de Repertório
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
              Atenção: <span className="text-on-surface font-semibold">"{topSongName}"</span> está entre as mais executadas. Considere rodízio com novas canções de adoção.
            </p>
          </div>
        </div>
      </section>

      {/* Ranking de Músicos e Vocais */}
      <TopMembersRank events={events} members={members} />

      {/* Músicas Mais Tocadas */}
      <TopSongsChart events={events} songs={songs} onSelectSong={onSelectSong} />

      {/* Distribuição de Tons e Estilos */}
      <KeysDistribution songs={songs} events={events} />
    </div>
  );
};
