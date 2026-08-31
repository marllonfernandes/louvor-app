import React from 'react';
import { Team, Member } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Users, Pencil, Trash2, MessageCircle } from 'lucide-react';
import { formatPhoneNumberForWhatsApp } from '../../utils/whatsapp';

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  allMembers: Member[];
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
}

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
  isOpen,
  onClose,
  team,
  allMembers,
  onEditTeam,
  onDeleteTeam
}) => {
  if (!team) return null;

  const teamMembers = team.members
    .map(name => allMembers.find(m => m.name === name || m.id === name))
    .filter(Boolean) as Member[];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={team.name}
      subtitle={`Equipe de Louvor • ${team.members.length} integrantes`}
    >
      <div className="space-y-4 text-left">
        {/* Descrição do Time (se houver) */}
        {team.description && (
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <p className="font-bold text-slate-400 mb-0.5">Descrição:</p>
            <p className="text-slate-300 leading-relaxed">{team.description}</p>
          </div>
        )}

        {/* Lista de Integrantes Escalados */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} className="text-blue-600 dark:text-blue-400" />
            Integrantes do Time ({teamMembers.length})
          </h4>

          {teamMembers.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
              Nenhum integrante adicionado a esta equipe ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map(m => {
                const initials = m.name
                  .split(' ')
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                const formattedPhone = formatPhoneNumberForWhatsApp(m.phone);
                const waLink = formattedPhone ? `https://wa.me/${formattedPhone}` : null;

                return (
                  <div
                    key={m.id}
                    className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-100 text-xs truncate">{m.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{m.role}</p>
                      </div>
                    </div>

                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 active:scale-95 transition-all border border-blue-500/20"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 min-h-[42px] px-3.5 text-xs font-bold"
            onClick={() => {
              onClose();
              onEditTeam(team);
            }}
            icon={<Pencil size={15} />}
          >
            Editar Equipe
          </Button>

          <Button
            variant="danger"
            size="sm"
            className="min-h-[42px] px-3.5 text-xs font-bold flex-shrink-0"
            onClick={() => {
              if (confirm(`Deseja realmente remover o time "${team.name}"?`)) {
                onDeleteTeam(team.id);
                onClose();
              }
            }}
            icon={<Trash2 size={15} />}
          >
            Excluir
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
