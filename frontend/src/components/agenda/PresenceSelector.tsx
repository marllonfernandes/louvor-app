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
      container: 'p-1 rounded-xl gap-1',
      btn: 'h-7 px-2 text-[11px]',
      iconSize: 13
    },
    md: {
      container: 'p-1.5 rounded-2xl gap-1.5',
      btn: 'h-8 sm:h-9 px-2.5 sm:px-3 text-xs',
      iconSize: 14
    },
    lg: {
      container: 'p-1.5 rounded-2xl gap-1.5',
      btn: 'h-10 px-3.5 text-xs sm:text-sm',
      iconSize: 16
    }
  }[size];

  const options: {
    id: ConfirmationStatus;
    label: string;
    icon: (iconSize: number, isSelected: boolean) => React.ReactNode;
    activeClass: string;
    inactiveHover: string;
  }[] = [
    {
      id: 'accepted',
      label: 'Confirmar',
      icon: (s, isSelected) => (
        <Check size={s} className={`stroke-[3] ${isSelected ? 'text-white' : 'text-emerald-400/70 group-hover:text-emerald-300'}`} />
      ),
      activeClass: 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/60 border border-emerald-500 scale-[1.02]',
      inactiveHover: 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30'
    },
    {
      id: 'declined',
      label: 'Não vou',
      icon: (s, isSelected) => (
        <X size={s} className={`stroke-[3] ${isSelected ? 'text-white' : 'text-rose-400/70 group-hover:text-rose-300'}`} />
      ),
      activeClass: 'bg-rose-600 text-white font-extrabold shadow-md shadow-rose-950/50 ring-1 ring-rose-400/60 border border-rose-500 scale-[1.02]',
      inactiveHover: 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30'
    },
    {
      id: 'pending',
      label: 'Pendente',
      icon: (s, isSelected) => (
        <Clock size={s} className={`stroke-[2.5] ${isSelected ? 'text-slate-950' : 'text-amber-400/70 group-hover:text-amber-300'}`} />
      ),
      activeClass: 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/50 ring-1 ring-amber-300/80 border border-amber-400 scale-[1.02]',
      inactiveHover: 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/30'
    }
  ];

  return (
    <div
      className={`flex items-center w-full bg-slate-950/90 border border-slate-800 shadow-inner transition-colors ${sizeConfig.container}`}
    >
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
            className={`group flex-1 flex items-center justify-center gap-1.5 rounded-xl font-bold tracking-tight transition-all duration-150 active:scale-[0.97] select-none cursor-pointer border ${
              sizeConfig.btn
            } ${
              isSelected
                ? opt.activeClass
                : `bg-slate-900/60 border-slate-800/80 ${opt.inactiveHover}`
            }`}
          >
            {opt.icon(sizeConfig.iconSize, isSelected)}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
