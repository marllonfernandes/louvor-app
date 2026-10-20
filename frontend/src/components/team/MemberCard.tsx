import React from 'react';
import { Member } from '../../types';
import { MessageCircle, ChevronRight, Pencil, Crown } from 'lucide-react';
import { formatPhoneNumberForWhatsApp } from '../../utils/whatsapp';
import { useAuth } from '../../context/AuthContext';
import { isValidAvatarUrl, isSamePersonName } from '../../utils/avatar';
import { MemberAvatar } from '../ui/MemberAvatar';

interface MemberCardProps {
  member: Member;
  onSelectMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  onSelectMember, 
  onEditMember
}) => {
  const { userProfile, currentUser } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const isSelf = Boolean(
    userProfile &&
      (userProfile.id === member.id ||
        (userProfile.email && member.email && userProfile.email.toLowerCase() === member.email.toLowerCase()) ||
        isSamePersonName(userProfile.name, member.name))
  );

  const formattedPhone = formatPhoneNumberForWhatsApp(member.phone);
  const isPendingInvite = !member.uid && !isSelf;
  const inviteToken = member.inviteToken;
  const inviteUrl = inviteToken ? `${window.location.origin}?inviteToken=${inviteToken}` : window.location.origin;
  const inviteMessage = `Olá ${member.name.split(' ')[0]}! Convite para acessar o Louvor App. Clique no link abaixo para entrar com o Google:\n\n${inviteUrl}`;

  const waLink = formattedPhone 
    ? (isPendingInvite && isLeader
        ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(inviteMessage)}`
        : `https://wa.me/${formattedPhone}`)
    : null;

  const rolesList = member.roles && member.roles.length > 0
    ? member.roles
    : (member.role ? member.role.split(/[,/]/).map(r => r.trim()).filter(Boolean) : ['Vocal']);

  const isRoleLeader = rolesList.includes('Líder');

  const resolvedAvatar = isValidAvatarUrl(member.avatar)
    ? member.avatar
    : isSelf
    ? (isValidAvatarUrl(userProfile?.avatar) ? userProfile?.avatar : currentUser?.photoURL)
    : undefined;

  return (
    <div 
      onClick={() => onSelectMember(member)}
      className="bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-xs transition-all text-left cursor-pointer active:scale-[0.98] select-none group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Avatar com Foto do Google / Galeria ou Gradiente com Iniciais */}
        <MemberAvatar
          name={member.name}
          avatarUrl={resolvedAvatar}
          size="md"
          shape="rounded-2xl"
          isLeader={isRoleLeader}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
              {member.name}
            </h4>
            {isRoleLeader && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md flex-shrink-0">
                <Crown size={11} className="text-amber-500 dark:text-amber-400" />
                Líder
              </span>
            )}
            {isPendingInvite && isLeader && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md flex-shrink-0">
                Convite Pendente
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {rolesList.filter(r => r !== 'Líder').map(r => (
              <span key={r} className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20">
                {r}
              </span>
            ))}
            {member.phone && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                • {member.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        {/* Botão WhatsApp com área de toque mínima de 44px */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-90 transition-all border border-emerald-500/20 shadow-2xs"
            title={isPendingInvite && isLeader ? "Enviar Convite com Link no WhatsApp" : "Abrir WhatsApp"}
          >
            <MessageCircle size={17} />
          </a>
        )}

        {(isLeader || isSelf) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditMember(member);
            }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-90 transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60"
            title="Editar Integrante"
          >
            <Pencil size={15} />
          </button>
        )}

        <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all p-1">
          <ChevronRight size={18} />
        </span>
      </div>
    </div>
  );
};
