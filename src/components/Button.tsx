import { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  'data-coachmark'?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  'data-coachmark': dataCoachmark,
}: ButtonProps) {
  const baseClasses = 'px-5 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400',
    danger: 'bg-white text-red-600 hover:text-red-700 border border-slate-300 hover:border-red-300',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      data-coachmark={dataCoachmark}
    >
      {children}
    </button>
  );
}
