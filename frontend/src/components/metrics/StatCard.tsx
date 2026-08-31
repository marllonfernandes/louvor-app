import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'cyan' | 'purple' | 'amber';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'blue',
  trend
}) => {
  const variantGlow = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-sm space-y-2 text-left relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl border ${variantGlow[variant]}`}>
          {icon}
        </div>
      </div>

      <div>
        <span className="text-2xl font-black text-slate-100 tracking-tight block">
          {value}
        </span>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 pt-1 border-t border-slate-700/40">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
