import { useEffect, useState, useRef } from 'react';
import { Button } from './Button';

export interface CoachmarkStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  targetPage?: string;
  waitForElement?: boolean;
  action?: 'click' | 'focus' | 'none';
}

interface CoachmarkProps {
  step: CoachmarkStep | null;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Coachmark({
  step,
  isActive,
  onNext,
  onPrevious,
  onSkip,
  currentStepIndex,
  totalSteps,
}: CoachmarkProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; arrow: string } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Find and track target element
  useEffect(() => {
    if (!step || !isActive) {
      setTargetElement(null);
      setElementPosition(null);
      setIsVisible(false);
      return;
    }

    const findElement = () => {
      // Try data attribute first
      let element = document.querySelector(`[data-coachmark="${step.targetSelector}"]`) as HTMLElement;

      // Fallback to CSS selector
      if (!element) {
        element = document.querySelector(step.targetSelector) as HTMLElement;
      }

      if (element) {
        setTargetElement(element);
        updatePosition(element);
        scrollToElement(element);
        setIsVisible(true);
      } else if (step.waitForElement) {
        // Retry after a short delay
        setTimeout(findElement, 100);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(findElement, 50);
    return () => clearTimeout(timer);
  }, [step, isActive]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!targetElement || !isActive) return;

    const updatePositions = () => {
      updatePosition(targetElement);
    };

    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);

    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [targetElement, isActive]);

  const scrollToElement = (element: HTMLElement) => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  };

  const updatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const padding = 8; // Padding around highlighted element

    setElementPosition({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position
    const tooltipWidth = 320;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
    const spacing = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let arrow: string;

    const position = step?.position || 'bottom';

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = 'bottom';
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = 'top';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - spacing;
        arrow = 'right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + spacing;
        arrow = 'left';
        break;
      case 'center':
        top = viewportHeight / 2 - tooltipHeight / 2;
        left = viewportWidth / 2 - tooltipWidth / 2;
        arrow = '';
        break;
      default:
        arrow = 'top';
    }

    // Adjust if tooltip goes off screen
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) {
      left = viewportWidth - tooltipWidth - 16;
    }
    if (top < 16) top = 16;
    if (top + tooltipHeight > viewportHeight - 16) {
      top = viewportHeight - tooltipHeight - 16;
    }

    setTooltipPosition({ top, left, arrow });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStepIndex > 0) {
          onPrevious();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onNext, onPrevious, onSkip, currentStepIndex]);

  if (!isActive || !step || !elementPosition || !tooltipPosition || !isVisible) {
    return null;
  }

  // Calculate clip-path for spotlight effect (inverted mask)
  const clipPath = `polygon(
    0% 0%,
    0% 100%,
    ${elementPosition.left}px 100%,
    ${elementPosition.left}px ${elementPosition.top}px,
    ${elementPosition.left + elementPosition.width}px ${elementPosition.top}px,
    ${elementPosition.left + elementPosition.width}px ${elementPosition.top + elementPosition.height}px,
    ${elementPosition.left}px ${elementPosition.top + elementPosition.height}px,
    ${elementPosition.left}px 100%,
    100% 100%,
    100% 0%
  )`;

  return (
    <div
      className="fixed inset-0 z-10000 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-label="Coachmark overlay"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark overlay with spotlight cutout */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"
        style={{
          clipPath,
          WebkitClipPath: clipPath,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-[var(--bg-card)] rounded-xl shadow-2xl p-6 max-w-sm z-10001 border border-[var(--border-color)]"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Arrow */}
        {tooltipPosition.arrow && (
          <div
            className={`absolute w-0 h-0 border-8 border-transparent ${tooltipPosition.arrow === 'top'
                ? '-top-4 left-1/2 -translate-x-1/2 border-b-[var(--bg-card)]'
                : tooltipPosition.arrow === 'bottom'
                  ? '-bottom-4 left-1/2 -translate-x-1/2 border-t-[var(--bg-card)]'
                  : tooltipPosition.arrow === 'left'
                    ? '-left-4 top-1/2 -translate-y-1/2 border-r-[var(--bg-card)]'
                    : '-right-4 top-1/2 -translate-y-1/2 border-l-[var(--bg-card)]'
              }`}
          />
        )}

        {/* Content */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[var(--text-main)]">{step.title}</h3>
            <span className="text-sm text-[var(--text-muted)]">
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-[var(--bg-main)] rounded-full h-1.5">
            <div
              className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            Skip Tour
          </button>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="secondary" onClick={onPrevious}>
                Previous
              </Button>
            )}
            <Button onClick={onNext}>
              {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
