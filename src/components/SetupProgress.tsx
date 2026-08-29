import { useState } from 'react';
import type { SetupProgress as SetupProgressData, SetupSectionId } from '@/utils/setupProgress';
import { Card, CardContent } from './Card';

interface SetupProgressProps {
  progress: SetupProgressData;
  compact?: boolean;
  onSectionClick?: (sectionId: SetupSectionId) => void;
}

export function SetupProgress({ progress, compact = false, onSectionClick }: SetupProgressProps) {
  const [showCompletedSections, setShowCompletedSections] = useState(false);

  const completedSectionCount = progress.sections.filter((section) => section.complete).length;
  const incompleteSections = progress.sections.filter((section) => !section.complete);
  const visibleSections = showCompletedSections
    ? progress.sections
    : incompleteSections;

  const statusLabel = progress.fullyComplete
    ? 'Setup complete'
    : progress.requiredComplete
      ? 'Required setup complete — optional steps remain'
      : 'Complete required setup to create invoices';

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[var(--text-main)] font-medium">Setup progress</span>
          <span className="text-[var(--text-muted)]">{progress.overallPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-main)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${progress.overallPercent}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {progress.completedSteps} of {progress.totalSteps} sections complete
        </p>
      </div>
    );
  }

  return (
    <Card className="mb-6 border border-[var(--border-color)]">
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Setup Progress</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">{statusLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-primary)]">{progress.overallPercent}%</p>
            <p className="text-xs text-[var(--text-muted)]">
              {progress.completedSteps} of {progress.totalSteps} sections
            </p>
          </div>
        </div>

        <div className="h-2.5 rounded-full bg-[var(--bg-main)] overflow-hidden mb-6">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${progress.overallPercent}%` }}
          />
        </div>

        <div className="space-y-4">
          {visibleSections.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/50 p-4 text-center">
              <p className="text-sm text-[var(--text-main)] font-medium">All sections complete</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Completed sections are hidden. Show them again if you want to review or update.
              </p>
            </div>
          ) : (
            visibleSections.map((section) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--text-main)]">{section.label}</h3>
                      {section.required ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary-bkg)] text-[var(--color-primary)]">
                          Required
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--bg-main)] text-[var(--text-muted)]">
                          Optional
                        </span>
                      )}
                      {section.complete && (
                        <span className="text-xs font-medium text-green-600">Complete</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{section.description}</p>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-muted)] whitespace-nowrap">
                    {section.filledCount}/{section.totalCount}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-[var(--bg-main)] overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      section.complete ? 'bg-green-500' : 'bg-[var(--color-primary)]'
                    }`}
                    style={{ width: `${section.percent}%` }}
                  />
                </div>

                {!section.complete && section.missingLabels.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-left">
                    Missing: {section.missingLabels.join(', ')}
                  </p>
                )}
              </>
            );

            if (onSectionClick) {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionClick(section.id)}
                  className="w-full rounded-lg border border-[var(--border-color)] p-4 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                  aria-label={`Go to ${section.label} form`}
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={section.id} className="rounded-lg border border-[var(--border-color)] p-4">
                {content}
              </div>
            );
          })
          )}

          {completedSectionCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCompletedSections((visible) => !visible)}
              className="w-full text-sm font-medium text-[var(--color-primary)] hover:text-[var(--text-main)] transition-colors py-1"
            >
              {showCompletedSections
                ? 'Hide completed sections'
                : `Show ${completedSectionCount} completed section${completedSectionCount === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
