import React from 'react';
import { Song, WorshipEvent } from '../../types';
import { Disc3, Layers } from 'lucide-react';

interface KeysDistributionProps {
  songs: Song[];
  events: WorshipEvent[];
}

export const KeysDistribution: React.FC<KeysDistributionProps> = ({ songs, events }) => {
  // Contagem por estilo/categoria
  const categoryCounts: Record<string, number> = {};
  songs.forEach(s => {
    const cat = s.category || 'Geral';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Contagem por tom mais tocado
  const keyUsage: Record<string, number> = {};
  events.forEach(e => {
    (e.songIds || []).forEach(id => {
      const song = songs.find(s => s.id === id);
      if (song && song.key) {
        keyUsage[song.key] = (keyUsage[song.key] || 0) + 1;
      }
    });
  });

  // Se não houver eventos com músicas, fallback para o repertório cadastrado
  if (Object.keys(keyUsage).length === 0) {
    songs.forEach(s => {
      if (s.key) keyUsage[s.key] = (keyUsage[s.key] || 0) + 1;
    });
  }

  const sortedKeys = Object.entries(keyUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalKeysCount = Object.values(keyUsage).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
      {/* Distribuição por Categoria */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-inner">
            <Layers size={16} />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-xs">Estilos de Louvor</h4>
            <p className="text-[10px] text-slate-400">Distribuição no repertório</p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {Object.entries(categoryCounts).map(([category, count]) => {
            const pct = Math.round((count / (songs.length || 1)) * 100);
            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{category}</span>
                  <span className="text-slate-400 font-bold">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tons Mais Frequentes */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
            <Disc3 size={16} />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-xs">Tons Mais Tocados</h4>
            <p className="text-[10px] text-slate-400">Tonalidades mais frequentes</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {sortedKeys.map(([k, count], idx) => {
            const pct = Math.round((count / totalKeysCount) * 100);
            return (
              <div
                key={k}
                className="flex-1 min-w-[70px] bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center space-y-0.5"
              >
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 block">
                  {k}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold">
                  {count}x ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
