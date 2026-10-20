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
      className="bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500/40 rounded-2xl p-4 shadow-xs space-y-3 transition-all text-left cursor-pointer active:scale-[0.98] select-none group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base group-hover:text-blue-600 dark:text-blue-300 transition-colors truncate">{team.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{team.members.length} integrantes escalados</p>
          </div>
        </div>

        {/* Ações de Edição com área de toque mínima de 44px */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {isLeader && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTeam(team);
              }}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold active:scale-90 transition-all shadow-2xs"
              title="Editar Integrantes do Time"
            >
              <Pencil size={15} />
            </button>
          )}

          <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all p-1">
            <ChevronRight size={18} />
          </span>
        </div>
      </div>

      {/* Amostra dos Membros do Time */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {team.members.length === 0 ? (
          <div className="w-full bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 italic">Nenhum integrante associado. Toque para ver detalhes.</span>
          </div>
        ) : (
          team.members.slice(0, 4).map((memberName, idx) => {
            const memberObj = allMembers.find(m => m.name === memberName);
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 text-slate-700 dark:text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800"
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
          <span className="inline-flex items-center bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold">
            +{team.members.length - 4} mais
          </span>
        )}
      </div>
    </div>
  );
};
