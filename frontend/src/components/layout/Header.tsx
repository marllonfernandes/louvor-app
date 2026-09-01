import React from 'react';
import { Music, Cloud, Database, Sliders, Sun, Moon, User as UserIcon } from 'lucide-react';
import { isFirestoreAvailable } from '../../config/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile } = useAuth();

  return (
    <header 
      className="flex-shrink-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)'
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-blue-950/40 flex-shrink-0">
          <Music size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 leading-tight flex items-center gap-1.5">
            Louvor App
            <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold px-1.5 py-0.5 rounded-md border border-blue-500/30">
              PRO
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 truncate max-w-[120px] xs:max-w-[200px]">
            {userProfile ? `Olá, ${userProfile.name.split(' ')[0]}` : 'Ministério de Música'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Avatar do Usuário */}
        {userProfile && (
          <div className="hidden xs:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={16} className="text-slate-400" />
            )}
          </div>
        )}

        {/* Status de Conexão Firestore */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-300 shadow-sm"
          title={isFirestoreAvailable ? "Conectado ao Cloud Firestore (app-unida)" : "Modo Local / Offline Ativo"}
        >
          {isFirestoreAvailable ? (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <Cloud size={12} className="text-blue-600 dark:text-blue-400" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <Database size={12} className="text-cyan-400" />
            </>
          )}
        </div>

        {/* Botão de Alternância de Tema */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-blue-600 dark:text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0"
          aria-label={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-indigo-400" />
          )}
        </button>

        {/* Botão de Configurações */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0 relative"
          aria-label="Configurações"
        >
          {/* Se estiver no mobile e tiver avatar, podemos mostrar o avatar aqui no lugar das configurações, mas vamos manter o botão separado */}
          {!userProfile?.avatar && <Sliders size={15} />}
          {userProfile?.avatar && (
            <div className="xs:hidden w-full h-full rounded-full overflow-hidden">
              <img src={userProfile.avatar} alt="Config" className="w-full h-full object-cover opacity-80 hover:opacity-100" />
            </div>
          )}
          {userProfile?.avatar && (
             <Sliders size={12} className="absolute -bottom-1 -right-1 text-slate-400 xs:block hidden" />
          )}
        </button>
      </div>
    </header>
  );
};
