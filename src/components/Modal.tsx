import { type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string; // Additional classes for wider modals
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`relative bg-[var(--bg-card)] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-lg border border-[var(--border-color)] animate-in fade-in zoom-in-95 duration-200 ${className}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">{title}</h2>
          <Button variant="secondary" onClick={onClose} className="!p-2 !rounded-full border-transparent hover:bg-[var(--bg-main)]">
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
