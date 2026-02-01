import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  'data-coachmark'?: string;
}

export function Card({ children, className = '', 'data-coachmark': dataCoachmark }: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
      data-coachmark={dataCoachmark}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-5 border-b border-[var(--border-color)] ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-6 ${className}`}>
      {children}
    </div>
  );
}
