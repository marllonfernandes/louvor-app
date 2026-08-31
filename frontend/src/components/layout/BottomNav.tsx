import React from 'react';
import { CalendarDays, Disc3, Users, BarChart3 } from 'lucide-react';
import { TabType } from '../../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  eventCount?: number;
  songCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  eventCount,
  songCount
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'agenda',
      label: 'Agenda',
      icon: <CalendarDays size={19} />,
      badge: eventCount
    },
    {
      id: 'playlist',
      label: 'Repertório',
      icon: <Disc3 size={19} />,
      badge: songCount
    },
    {
      id: 'team',
      label: 'Equipe',
      icon: <Users size={19} />
    },
    {
      id: 'metrics',
      label: 'Indicadores',
      icon: <BarChart3 size={19} />
    }
  ];

  return (
    <nav 
      className="flex-shrink-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-1 sm:px-4 py-2 shadow-2xl"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)'
      }}
    >
      <div className="w-full flex justify-around items-center">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                {/* Efeito Glow / Pill no ícone ativo */}
                {isActive && (
                  <span className="absolute -inset-1.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-sm -z-10" />
                )}
                {tab.icon}
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-blue-500 text-white dark:text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
