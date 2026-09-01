import React from 'react';
import { Member } from '../../types';
import { MessageCircle, ChevronRight, Pencil, Crown } from 'lucide-react';
import { formatPhoneNumberForWhatsApp } from '../../utils/whatsapp';
import { useAuth } from '../../context/AuthContext';

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
  const { userProfile } = useAuth();
  const isLeader = ['Admin', 'Editor'].includes(userProfile?.systemRole || '');
  const isSelf = userProfile?.id === member.id;

  return (
    <div 
      onClick={() => onSelectMember(member)}
      className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all text-left cursor-pointer active:scale-[0.99] group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Avatar com Iniciais e Borda Especial de Líder */}
        <div className={`w-11 h-11 rounded-2xl font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-inner ${
          isRoleLeader 
            ? 'bg-gradient-to-br from-amber-900/60 to-slate-900 text-amber-400 border border-amber-500/50' 
            : 'bg-gradient-to-br from-slate-700 to-slate-800 text-blue-400 border border-slate-700'
        }`}>
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-100 text-base group-hover:text-blue-300 transition-colors truncate">
              {member.name}
            </h4>
            {isRoleLeader && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md flex-shrink-0">
                <Crown size={11} className="text-amber-400" />
                Líder
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {rolesList.filter(r => r !== 'Líder').map(r => (
              <span key={r} className="text-[11px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                {r}
              </span>
            ))}
            {member.phone && (
              <span className="text-[11px] text-slate-400 truncate">
                • {member.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {/* Botão WhatsApp */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 active:scale-95 transition-all border border-blue-500/20"
            title="Abrir WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        )}

        {(isLeader || isSelf) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditMember(member);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-700/80 active:scale-95 transition-all bg-slate-900 border border-slate-700/60"
            title="Editar Integrante"
          >
            <Pencil size={15} />
          </button>
        )}

        <span className="text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all p-1">
          <ChevronRight size={16} />
        </span>
      </div>
    </div>
  );
};
