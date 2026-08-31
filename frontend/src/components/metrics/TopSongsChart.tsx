import React from 'react';
import { WorshipEvent, Song } from '../../types';
import { Music, Trophy, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface TopSongsChartProps {
  events: WorshipEvent[];
  songs: Song[];
  onSelectSong?: (song: Song) => void;
}

export const TopSongsChart: React.FC<TopSongsChartProps> = ({ events, songs, onSelectSong }) => {
  // Contabiliza frequência de cada música nas escalas
  const songUsageMap = new Map<string, number>();

  events.forEach(event => {
    (event.songIds || []).forEach(songId => {
      songUsageMap.set(songId, (songUsageMap.get(songId) || 0) + 1);
    });
  });

  // Mapeia para lista ordenada
  const rankedSongs = songs
    .map(song => ({
      song,
      count: songUsageMap.get(song.id) || 0
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...rankedSongs.map(r => r.count), 1);
  const totalPlayCount = rankedSongs.reduce((acc, r) => acc + r.count, 0);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-sm">🥇</span>;
    if (index === 1) return <span className="text-sm">🥈</span>;
    if (index === 2) return <span className="text-sm">🥉</span>;
    return <span className="text-xs font-bold text-slate-500">#{index + 1}</span>;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3.5 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Louvores Mais Tocados</h3>
            <p className="text-[11px] text-slate-400">Frequência nas escalas e cultos</p>
          </div>
        </div>

        <span className="text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-semibold">
          {totalPlayCount} execuções totais
        </span>
      </div>

      {rankedSongs.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-3 text-center">
          Nenhuma música adicionada às escalas ainda.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rankedSongs.slice(0, 5).map(({ song, count }, index) => {
            const percentage = Math.round((count / maxCount) * 100);

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong && onSelectSong(song)}
                className={`p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 transition-all cursor-pointer ${
                  index === 0 ? 'border-amber-500/30 bg-amber-950/10' : 'hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 flex items-center justify-center flex-shrink-0">
                      {getRankBadge(index)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{song.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="blue" size="sm">
                      {song.key}
                    </Badge>
                    <span className="text-xs font-black text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                      {count}x
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-500 to-blue-400'
                        : 'bg-gradient-to-r from-blue-500 to-teal-400'
                    }`}
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
