import React from 'react';
import { Sliders, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MemberAvatar } from '../ui/MemberAvatar';
import { TabType } from '../../types';

interface HeaderProps {
  activeTab?: TabType;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  churchName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'inicio',
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  churchName = 'Igreja Unida'
}) => {
  const { userProfile, currentUser } = useAuth();
  const profileAvatar = userProfile?.avatar || currentUser?.photoURL;

  const tabLabels: Record<TabType, string> = {
    inicio: 'Início',
    playlist: 'Repertório',
    agenda: 'Escalas',
    team: 'Equipes',
    metrics: 'Métricas',
    settings: 'Configurações'
  };

  const currentTabName = tabLabels[activeTab] || 'Início';

  return (
    <header 
      className="flex-shrink-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 px-4 py-3 flex items-center justify-between transition-colors duration-200 shadow-[0_1px_8px_rgba(0,0,0,0.25)]"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)'
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">music_note</span>
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-1.5">
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">
              Louvor App
            </h1>
            <span className="font-label-sm text-label-sm uppercase bg-surface-container-high text-primary px-1.5 py-0.5 rounded-full border border-outline-variant/30 font-bold">
              Pro
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {churchName || 'Igreja Unida'} • {currentTabName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Botão de Central de Notificações (Sininho) */}
        <button
          onClick={onOpenNotifications}
          className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all shadow-sm shrink-0 relative cursor-pointer flex items-center justify-center"
          aria-label="Notificações"
          title="Notificações e alertas no celular"
        >
          <Bell size={18} className={unreadNotificationsCount > 0 ? 'text-primary' : ''} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[9px] font-black flex items-center justify-center ring-2 ring-surface">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Avatar / Perfil do Músico (Abre Configurações onde fica a seleção de tema) */}
        {userProfile ? (
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform ring-2 ring-primary/40 p-0.5 cursor-pointer"
            title="Perfil e Configurações"
          >
            <MemberAvatar
              name={userProfile.name}
              avatarUrl={profileAvatar}
              size="xs"
              shape="rounded-full"
              className="w-full h-full"
            />
          </button>
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all shadow-sm shrink-0 relative cursor-pointer flex items-center justify-center"
            aria-label="Configurações"
          >
            <Sliders size={18} />
          </button>
        )}
      </div>
    </header>
  );
};
