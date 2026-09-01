import React from 'react';
import { Team, Member } from '../../types';
import { Users, Pencil, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TeamCardProps {
  team: Team;
  allMembers: Member[];
  onSelectTeam: (team: Team) => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ 
  team, 
  allMembers, 
  onSelectTeam, 
  onEditTeam 
}) => {
  const { userProfile } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');

  return (
    <div 
      onClick={() => onSelectTeam(team)}
      className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 rounded-2xl p-4 shadow-sm space-y-3 transition-all text-left cursor-pointer active:scale-[0.99] group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner flex-shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-700 dark:text-blue-300 transition-colors">{team.name}</h3>
            <p className="text-xs text-slate-400">{team.members.length} integrantes escalados</p>
          </div>
        </div>

        {/* Ações de Edição e Indicador de Detalhes */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLeader && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTeam(team);
              }}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-blue-600 dark:text-blue-400 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold active:scale-95 transition-all"
              title="Editar Integrantes do Time"
            >
              <Pencil size={14} />
            </button>
          )}

          <span className="text-slate-400 group-hover:text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-all p-1">
            <ChevronRight size={16} />
          </span>
        </div>
      </div>

      {/* Amostra dos Membros do Time */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {team.members.length === 0 ? (
          <div className="w-full bg-slate-950/60 p-2.5 rounded-xl border border-dashed border-slate-800 text-center">
            <span className="text-xs text-slate-500 italic">Nenhum integrante associado. Toque para ver detalhes.</span>
          </div>
        ) : (
          team.members.slice(0, 4).map((memberName, idx) => {
            const memberObj = allMembers.find(m => m.name === memberName);
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-slate-950/80 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-800"
              >
                <span>{memberName}</span>
                {memberObj && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    ({memberObj.role})
                  </span>
                )}
              </span>
            );
          })
        )}
        {team.members.length > 4 && (
          <span className="inline-flex items-center bg-slate-900 text-slate-400 text-xs px-2 py-1 rounded-lg border border-slate-800 font-semibold">
            +{team.members.length - 4} mais
          </span>
        )}
      </div>
    </div>
  );
};
