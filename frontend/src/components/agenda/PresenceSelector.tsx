import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { ConfirmationStatus } from '../../types';

interface PresenceSelectorProps {
  status: ConfirmationStatus;
  onChange: (status: ConfirmationStatus) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const PresenceSelector: React.FC<PresenceSelectorProps> = ({
  status,
  onChange,
  size = 'md'
}) => {
  const sizeConfig = {
    sm: {
      container: 'gap-1.5',
      btn: 'h-8 px-2.5 text-[11px]',
      iconBadge: 'w-4 h-4',
      iconSize: 10
    },
    md: {
      container: 'gap-2',
      btn: 'h-9 px-3 text-xs',
      iconBadge: 'w-5 h-5',
      iconSize: 12
    },
    lg: {
      container: 'gap-2',
      btn: 'h-10 px-3.5 text-xs sm:text-sm',
      iconBadge: 'w-5 h-5',
      iconSize: 13
    }
  }[size];

  const options: {
    id: ConfirmationStatus;
    label: string;
    activeLabel: string;
    icon: (iconSize: number) => React.ReactNode;
    activeBadgeClass: string;
    inactiveBadgeClass: string;
    activePillClass: string;
    inactivePillClass: string;
  }[] = [
    {
      id: 'accepted',
      label: 'Vou',
      activeLabel: 'Confirmado',
      icon: (s) => <Check size={s} className="stroke-[3]" />,
      activeBadgeClass:
        'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30',
      inactiveBadgeClass:
        'bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25',
      activePillClass:
        'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-400/80 dark:border-emerald-500/50 ring-1 ring-emerald-400/40 dark:ring-emerald-500/30 shadow-xs',
      inactivePillClass:
        'bg-slate-100/90 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10'
    },
    {
      id: 'declined',
      label: 'Não vou',
      activeLabel: 'Não vou',
      icon: (s) => <X size={s} className="stroke-[3]" />,
      activeBadgeClass:
        'bg-rose-500 text-white shadow-xs shadow-rose-500/30',
      inactiveBadgeClass:
        'bg-rose-500/15 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/25',
      activePillClass:
        'bg-rose-500/15 dark:bg-rose-500/20 text-rose-900 dark:text-rose-200 border-rose-400/80 dark:border-rose-500/50 ring-1 ring-rose-400/40 dark:ring-rose-500/30 shadow-xs',
      inactivePillClass:
        'bg-slate-100/90 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200/90 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-500/10'
    },
    {
      id: 'pending',
      label: 'Pendente',
      activeLabel: 'Pendente',
      icon: (s) => <Clock size={s} className="stroke-[2.5]" />,
      activeBadgeClass:
        'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/30',
      inactiveBadgeClass:
        'bg-amber-500/15 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500/25',
      activePillClass:
        'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/40 dark:ring-amber-500/30 shadow-xs',
      inactivePillClass:
        'bg-slate-100/90 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/10'
    }
  ];

  return (
    <div className={`flex items-center w-full ${sizeConfig.container}`}>
      {options.map((opt) => {
        const isSelected = status === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt.id);
            }}
            className={`group flex-1 flex items-center justify-center gap-1.5 rounded-full font-bold tracking-tight transition-all duration-200 active:scale-95 select-none cursor-pointer border ${
              sizeConfig.btn
            } ${isSelected ? opt.activePillClass : opt.inactivePillClass}`}
          >
            <span
              className={`rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                sizeConfig.iconBadge
              } ${isSelected ? opt.activeBadgeClass : opt.inactiveBadgeClass}`}
            >
              {opt.icon(sizeConfig.iconSize)}
            </span>
            <span className="truncate">{isSelected ? opt.activeLabel : opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
