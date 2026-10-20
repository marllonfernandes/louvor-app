import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = ''
}) => {
  return (
    <div
      className={`bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3.5 transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-xs">
        <Icon size={26} className="stroke-[2.2]" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {(actionText && onAction) || (secondaryActionText && onSecondaryAction) ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
          {actionText && onAction && (
            <Button
              size="sm"
              variant="primary"
              onClick={onAction}
              icon={actionIcon}
              className="min-h-[44px] px-4 font-bold active:scale-95 text-xs sm:text-sm"
            >
              {actionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSecondaryAction}
              className="min-h-[44px] px-3.5 font-bold active:scale-95 text-xs text-slate-600 dark:text-slate-400"
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};
