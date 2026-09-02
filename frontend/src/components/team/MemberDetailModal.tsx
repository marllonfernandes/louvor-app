import React, { useState } from 'react';
import { Member, Team } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { MessageCircle, Pencil, Trash2, Users, Phone, Crown } from 'lucide-react';
import { formatPhoneNumberForWhatsApp } from '../../utils/whatsapp';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  teams: Team[];
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string, name?: string) => void;
  onSaveMember?: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  teams,
  onEditMember,
  onDeleteMember,
  onSaveMember
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!member) return null;

  const initials = member.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const formattedPhone = formatPhoneNumberForWhatsApp(member.phone);
  const waLink = formattedPhone ? `https://wa.me/${formattedPhone}` : null;

  const rolesList = member.roles && member.roles.length > 0
    ? member.roles
    : (member.role ? member.role.split(/[,/]/).map(r => r.trim()).filter(Boolean) : ['Vocal']);

  const isRoleLeader = rolesList.includes('Líder');
  const memberTeams = teams.filter(t => t.members.includes(member.name));

  const { userProfile } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const isSelf = userProfile?.id === member.id;

  const handleSendInvite = () => {
    let currentToken = member.inviteToken;
    if (!currentToken) {
      currentToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      if (onSaveMember) {
        onSaveMember({ ...member, inviteToken: currentToken });
      }
    }
    
    const inviteUrl = `${window.location.origin}?inviteToken=${currentToken}`;
    const message = `Olá ${member.name.split(' ')[0]}! Aqui está o seu convite para acessar o App Louvor. Clique no link abaixo para se conectar com sua conta Google e acessar as escalas:\n\n${inviteUrl}`;
    
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={member.name}
        subtitle={rolesList.join(' • ')}
      >
        <div className="space-y-4 text-left">
          {/* Card do Perfil do Membro */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl font-black text-lg flex items-center justify-center flex-shrink-0 shadow-inner ${
              isLeader
                ? 'bg-gradient-to-br from-amber-900/60 to-slate-900 text-amber-400 border border-amber-500/50'
                : 'bg-gradient-to-br from-slate-700 to-slate-800 text-blue-400 border border-slate-700'
            }`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-100 text-base truncate">{member.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {isRoleLeader && (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
                    <Crown size={12} className="text-amber-400" />
                    Líder de Louvor
                  </span>
                )}
                {rolesList.filter(r => r !== 'Líder').map(r => (
                  <span key={r} className="inline-block text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contato & WhatsApp</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Phone size={14} className="text-blue-400" />
                <span>{member.phone || 'Telefone não cadastrado'}</span>
              </div>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  <MessageCircle size={14} />
                  <span>Conversar</span>
                </a>
              )}
            </div>

            {/* Gerenciamento de Acesso ao App */}
            {member.uid ? (
              <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Acesso ao Aplicativo</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Ativo</span>
              </div>
            ) : isLeader ? (
              <div className="pt-2 mt-2 border-t border-slate-800">
                <Button 
                  variant="primary" 
                  size="sm" 
                  fullWidth 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-500/50"
                  onClick={handleSendInvite}
                  icon={<MessageCircle size={14} />}
                >
                  Enviar Convite de Acesso (WhatsApp)
                </Button>
              </div>
            ) : (
              <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Acesso ao Aplicativo</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Pendente</span>
              </div>
            )}
          </div>

          {/* Equipes Participantes */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-blue-400" />
              Times & Escalas ({memberTeams.length})
            </p>

            {memberTeams.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                Este membro ainda não foi associado a nenhum time.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {memberTeams.map(team => (
                  <span
                    key={team.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-xs font-bold"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {team.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé de Ações */}
          {(isLeader || isSelf) && (
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 min-h-[42px] px-3.5 text-xs font-bold"
                onClick={() => {
                  onClose();
                  setTimeout(() => onEditMember(member), 300);
                }}
                icon={<Pencil size={15} />}
              >
                Editar Integrante
              </Button>

              {isLeader && (
                <Button
                  variant="danger"
                  size="sm"
                  className="min-h-[42px] px-3.5 text-xs font-bold flex-shrink-0"
                  onClick={() => setShowConfirmDelete(true)}
                  icon={<Trash2 size={15} />}
                >
                  Excluir
                </Button>
              )}
            </div>
          )}
        </div>
      </BottomSheet>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Excluir Integrante"
        message={`Tem certeza que deseja remover "${member.name}" da equipe? Esta ação também o removerá das sub-equipes e das escalas agendadas.`}
        confirmText="Sim, Excluir"
        onConfirm={() => {
          onDeleteMember(member.id, member.name);
          setShowConfirmDelete(false);
          onClose();
        }}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};
