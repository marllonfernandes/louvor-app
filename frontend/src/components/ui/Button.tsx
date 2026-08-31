import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 border border-blue-500/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:bg-slate-700/80",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 border border-rose-500/30",
    ghost: "bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200",
    whatsapp: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/50"
  };

  const sizes = {
    sm: "text-xs px-3.5 py-2.5 gap-2 min-h-[38px]",
    md: "text-sm px-4.5 py-3.5 gap-2.5 min-h-[46px]",
    lg: "text-base px-6 py-4 gap-3 min-h-[52px]",
    icon: "p-3 rounded-2xl min-h-[44px] min-w-[44px]"
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
