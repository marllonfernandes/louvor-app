import React from 'react';
import { Music, Cloud, Database, Sliders, Sun, Moon } from 'lucide-react';
import { isFirestoreAvailable } from '../../config/firebase';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { theme, toggleTheme } = useTheme();

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
          <p className="text-[11px] text-slate-400">Ministério de Música • UNIDA</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Status de Conexão Firestore */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-300 shadow-sm"
          title={isFirestoreAvailable ? "Conectado ao Cloud Firestore (app-unida)" : "Modo Local / Offline Ativo"}
        >
          {isFirestoreAvailable ? (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <Cloud size={12} className="text-blue-600 dark:text-blue-400" />
              <span className="hidden xs:inline text-blue-700 dark:text-blue-300">Nuvem</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <Database size={12} className="text-cyan-400" />
              <span className="hidden xs:inline text-slate-300">Local</span>
            </>
          )}
        </div>

        {/* Botão de Alternância de Tema (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-blue-600 dark:text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          aria-label={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
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
          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          aria-label="Configurações e Nuvem"
          title="Configurações e Nuvem"
        >
          <Sliders size={15} />
        </button>
      </div>
    </header>
  );
};
