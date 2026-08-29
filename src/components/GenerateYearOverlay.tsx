import { Button } from './Button';

export type GenerateYearPhase = 'generating' | 'success' | 'error';

export interface GenerateYearProgress {
  current: number;
  total: number;
  monthLabel: string;
}

export interface GenerateYearResult {
  created: number;
  updated: number;
  skipped: number;
}

interface GenerateYearOverlayProps {
  isOpen: boolean;
  phase: GenerateYearPhase;
  year: number;
  progress: GenerateYearProgress;
  result?: GenerateYearResult;
  errorMessage?: string;
  onClose?: () => void;
}

function formatResultSummary(result: GenerateYearResult): string {
  const parts: string[] = [];
  if (result.created > 0) parts.push(`${result.created} created`);
  if (result.updated > 0) parts.push(`${result.updated} updated`);
  if (result.skipped > 0) parts.push(`${result.skipped} unchanged`);
  return parts.length > 0 ? parts.join(', ') : 'No changes needed';
}

export function GenerateYearOverlay({
  isOpen,
  phase,
  year,
  progress,
  result,
  errorMessage,
  onClose,
}: GenerateYearOverlayProps) {
  if (!isOpen) return null;

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-overlay-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-year-overlay-title"
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-8 animate-overlay-card-in">
        {phase === 'generating' && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="h-12 w-12 rounded-full border-[3px] border-[var(--color-primary-bkg)] border-t-[var(--color-primary)] animate-generate-spin"
                aria-hidden="true"
              />
            </div>
            <h2
              id="generate-year-overlay-title"
              className="text-lg font-semibold text-[var(--text-main)] text-center mb-2"
            >
              Generating invoices for {year}
            </h2>
            <p className="text-sm text-[var(--text-muted)] text-center mb-6">
              Processing {progress.monthLabel || '…'} ({progress.current} of {progress.total})
            </p>
            <div className="h-2.5 rounded-full bg-[var(--bg-main)] overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] animate-progress-pulse transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">{progressPercent}%</p>
          </>
        )}

        {phase === 'success' && result && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-success-pop"
                aria-hidden="true"
              >
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2
              id="generate-year-overlay-title"
              className="text-lg font-semibold text-[var(--text-main)] text-center mb-2"
            >
              Invoices generated
            </h2>
            <p className="text-sm text-[var(--text-muted)] text-center">
              {formatResultSummary(result)}
            </p>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
                aria-hidden="true"
              >
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2
              id="generate-year-overlay-title"
              className="text-lg font-semibold text-[var(--text-main)] text-center mb-2"
            >
              Generation failed
            </h2>
            <p className="text-sm text-[var(--text-muted)] text-center mb-6">
              {errorMessage || 'Something went wrong while generating invoices.'}
            </p>
            <div className="flex justify-center">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
