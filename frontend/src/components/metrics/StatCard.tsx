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
  const variantIcons = {
    blue: 'bg-primary-container/20 text-primary border-primary/20',
    cyan: 'bg-secondary-container/30 text-secondary border-secondary/20',
    purple: 'bg-tertiary-container/30 text-tertiary border-tertiary/20',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/20'
  };

  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded-2xl p-3.5 shadow-sm space-y-2 text-left relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${variantIcons[variant]}`}>
          {icon}
        </div>
      </div>

      <div>
        <span className="font-headline-lg text-2xl font-black text-on-surface tracking-tight block">
          {value}
        </span>
        {subtitle && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="pt-1 border-t border-outline-variant/10 flex items-center gap-1">
          <span className="inline-flex items-center text-[10px] font-bold text-primary bg-primary-container/30 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
