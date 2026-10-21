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
      className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/15 rounded-2xl p-3 flex items-center justify-between shadow-sm transition-all text-left cursor-pointer active:scale-[0.99] select-none group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar com halo dourado se for líder */}
        <div className={`relative flex-shrink-0 ${isRoleLeader ? 'ring-2 ring-amber-500/40 rounded-2xl p-0.5' : ''}`}>
          <MemberAvatar
            name={member.name}
            avatarUrl={resolvedAvatar}
            size="md"
            shape="rounded-2xl"
            isLeader={isRoleLeader}
          />
          {isRoleLeader && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[10px] font-bold">star</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors truncate font-bold">
              {member.name}
            </h4>
            {isRoleLeader && (
              <span className="inline-flex items-center gap-1 font-label-sm text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                Líder
              </span>
            )}
            {isPendingInvite && isLeader && (
              <span className="inline-flex items-center gap-1 font-label-sm text-[9px] font-bold bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.2 rounded-full">
                Convite Pendente
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {rolesList.filter(r => r !== 'Líder').map(r => (
              <span key={r} className="font-label-md text-label-md text-secondary bg-surface-container-high px-2 py-0.5 rounded-md border border-outline-variant/20">
                {r}
              </span>
            ))}
            {member.phone && (
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                • {member.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center active:scale-90 transition-all border border-outline-variant/20"
            title={isPendingInvite ? "Enviar convite via WhatsApp" : "Conversar no WhatsApp"}
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">chat</span>
          </a>
        )}

        {isLeader && (
          <button
            onClick={e => {
              e.stopPropagation();
              onEditMember(member);
            }}
            className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center active:scale-90 transition-all border border-outline-variant/20"
            title="Editar Integrante"
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>
        )}
      </div>
    </div>
  );
};
