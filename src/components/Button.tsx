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
  const baseClasses = 'px-5 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:shadow-sm transform active:scale-[0.98]';

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] border-transparent',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-main)]',
    danger: 'bg-[var(--bg-card)] text-red-600 hover:text-red-700 border border-[var(--border-color)] hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
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
