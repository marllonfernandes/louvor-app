import React from 'react';
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
  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    {
      id: 'inicio',
      label: 'Início',
      icon: 'home'
    },
    {
      id: 'playlist',
      label: 'Repertório',
      icon: 'queue_music',
      badge: songCount
    },
    {
      id: 'agenda',
      label: 'Escalas',
      icon: 'event_available',
      badge: eventCount
    },
    {
      id: 'team',
      label: 'Equipes',
      icon: 'groups'
    },
    {
      id: 'metrics',
      label: 'Métricas',
      icon: 'insights'
    }
  ];

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface-container/85 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.25)] border-t border-outline-variant/20"
      data-active-classes="text-primary font-bold"
    >
      <div className="h-16 max-w-md mx-auto flex items-center justify-around px-gutter">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              data-path={tab.id}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-95 cursor-pointer relative ${
                isActive 
                  ? 'text-primary font-bold' 
                  : 'text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">
                  {tab.icon}
                </span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 bg-primary-container text-on-primary-container font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-surface">
                    {tab.badge! > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="font-label-sm text-label-sm mt-0.5 tracking-tight leading-none truncate max-w-[56px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
