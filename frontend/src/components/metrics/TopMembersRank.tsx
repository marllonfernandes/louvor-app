import React, { useState } from 'react';
import { WorshipEvent, Member } from '../../types';
import { Users, Award, Mic, Music, Sliders } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface TopMembersRankProps {
  events: WorshipEvent[];
  members: Member[];
}

type MemberCategoryFilter = 'all' | 'vocals' | 'musicians' | 'tech';

export const TopMembersRank: React.FC<TopMembersRankProps> = ({ events, members }) => {
  const [selectedCategory, setSelectedCategory] = useState<MemberCategoryFilter>('all');

  // Contabiliza total de confirmações e escalas por membro
  const statsMap = new Map<string, { confirmed: number; scheduled: number }>();

  events.forEach(event => {
    Object.entries(event.confirmed || {}).forEach(([memberName, status]) => {
      const current = statsMap.get(memberName) || { confirmed: 0, scheduled: 0 };
      statsMap.set(memberName, {
        confirmed: current.confirmed + (status === 'accepted' ? 1 : 0),
        scheduled: current.scheduled + 1
      });
    });
  });

  // Função para categorizar função do membro
  const isVocal = (role: string) => {
    const r = role.toLowerCase();
    return r.includes('vocal') || r.includes('ministro') || r.includes('voz');
  };

  const isTech = (role: string) => {
    const r = role.toLowerCase();
    return r.includes('som') || r.includes('sonoplastia') || r.includes('mídia') || r.includes('projeção');
  };

  const isMusician = (role: string) => {
    return !isVocal(role) && !isTech(role);
  };

  // Filtra por categoria
  const filteredMembers = members.filter(member => {
    if (selectedCategory === 'vocals') return isVocal(member.role);
    if (selectedCategory === 'musicians') return isMusician(member.role);
    if (selectedCategory === 'tech') return isTech(member.role);
    return true;
  });

  // Ordena por maior número de presenças confirmadas
  const rankedMembers = filteredMembers
    .map(member => {
      const stats = statsMap.get(member.name) || { confirmed: 0, scheduled: 0 };
      const rate = stats.scheduled > 0 ? Math.round((stats.confirmed / stats.scheduled) * 100) : 0;
      return {
        member,
        confirmed: stats.confirmed,
        scheduled: stats.scheduled,
        rate
      };
    })
    .sort((a, b) => b.confirmed - a.confirmed || b.rate - a.rate);

  const maxConfirmed = Math.max(...rankedMembers.map(r => r.confirmed), 1);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-sm">🥇</span>;
    if (index === 1) return <span className="text-sm">🥈</span>;
    if (index === 2) return <span className="text-sm">🥉</span>;
    return <span className="text-xs font-bold text-slate-500">#{index + 1}</span>;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3.5 text-left">
      {/* Topo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
            <Award size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Integrantes Mais Participativos</h3>
            <p className="text-[11px] text-slate-400">Presença e assiduidade nos cultos</p>
          </div>
        </div>
      </div>

      {/* Segmented Chips de Categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Todos', icon: <Users size={12} /> },
          { id: 'vocals', label: 'Vocais & Ministros', icon: <Mic size={12} /> },
          { id: 'musicians', label: 'Instrumentistas', icon: <Music size={12} /> },
          { id: 'tech', label: 'Técnica & Som', icon: <Sliders size={12} /> }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as MemberCategoryFilter)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700/80'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Lista de Ranking */}
      {rankedMembers.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-3 text-center">
          Nenhum integrante encontrado nesta categoria.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rankedMembers.slice(0, 6).map(({ member, confirmed, scheduled, rate }, index) => {
            const percentage = Math.round((confirmed / maxConfirmed) * 100);
            const initials = member.name
              .split(' ')
              .slice(0, 2)
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <div
                key={member.id}
                className={`p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 transition-all ${
                  index === 0 ? 'border-purple-500/30 bg-purple-950/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 flex items-center justify-center flex-shrink-0">
                      {getRankBadge(index)}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-purple-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 border border-slate-700">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {confirmed} cultos
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({rate}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra de Engajamento */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-400'
                        : 'bg-gradient-to-r from-blue-500 to-teal-400'
                    }`}
                    style={{ width: `${Math.max(percentage, 6)}%` }}
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
