import React from 'react';
import { Music, Cloud, Database, Sliders, Sun, Moon, Bell } from 'lucide-react';
import { isFirestoreAvailable } from '../../config/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MemberAvatar } from '../ui/MemberAvatar';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, currentUser } = useAuth();
  const profileAvatar = userProfile?.avatar || currentUser?.photoURL;

  return (
    <header 
      className="flex-shrink-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between transition-colors duration-200"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)'
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
          <Music size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1.5">
            Louvor App
            <span className="text-[10px] bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold px-1.5 py-0.5 rounded-md border border-blue-500/20 dark:border-blue-500/30">
              PRO
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px] xs:max-w-[200px]">
            {userProfile ? `Olá, ${userProfile.name.split(' ')[0]}` : 'Ministério de Música'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Avatar do Usuário */}
        {userProfile && (
          <div className="hidden xs:flex items-center justify-center shrink-0">
            <MemberAvatar
              name={userProfile.name}
              avatarUrl={profileAvatar}
              size="xs"
              shape="rounded-full"
              className="w-8 h-8"
            />
          </div>
        )}

        {/* Status de Conexão Firestore */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm"
          title={isFirestoreAvailable ? "Conectado ao Cloud Firestore (app-unida)" : "Modo Local / Offline Ativo"}
        >
          {isFirestoreAvailable ? (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              <Cloud size={12} className="text-blue-600 dark:text-blue-400" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
              <Database size={12} className="text-cyan-600 dark:text-cyan-400" />
            </>
          )}
        </div>

        {/* Botão de Central de Notificações (Sininho) */}
        <button
          onClick={onOpenNotifications}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0 relative cursor-pointer"
          aria-label="Notificações"
          title="Notificações e alertas no celular"
        >
          <Bell size={15} className={unreadNotificationsCount > 0 ? 'text-blue-600 dark:text-blue-400' : ''} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Botão de Alternância de Tema */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0"
          aria-label={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-indigo-500" />
          )}
        </button>

        {/* Botão de Configurações */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0 relative"
          aria-label="Configurações"
        >
          <Sliders size={15} />
        </button>
      </div>
    </header>
  );
};
