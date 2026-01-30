import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { Coachmark, type CoachmarkStep } from './Coachmark';

interface CoachmarkContextType {
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  isActive: boolean;
  currentStep: CoachmarkStep | null;
  currentStepIndex: number;
  totalSteps: number;
}

const CoachmarkContext = createContext<CoachmarkContextType | undefined>(undefined);

export function useCoachmarkContext() {
  const context = useContext(CoachmarkContext);
  if (!context) {
    throw new Error('useCoachmarkContext must be used within CoachmarkProvider');
  }
  return context;
}

interface CoachmarkProviderProps {
  children: ReactNode;
  steps: CoachmarkStep[];
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export function CoachmarkProvider({
  children,
  steps,
  onNavigate,
  currentPage,
}: CoachmarkProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = isActive && steps[currentStepIndex] ? steps[currentStepIndex] : null;

  // Handle page navigation when step requires it
  useEffect(() => {
    if (!currentStep || !onNavigate || !currentPage) return;

    if (currentStep.targetPage && currentPage !== currentStep.targetPage) {
      onNavigate(currentStep.targetPage);
      // Wait a bit for page to render before showing coachmark
      const timer = setTimeout(() => {
        // Step will be shown after navigation
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep, currentPage, onNavigate]);

  const startTour = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const stopTour = () => {
    setIsActive(false);
    localStorage.setItem('coachmark_completed', 'true');
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      stopTour();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const value: CoachmarkContextType = useMemo(() => ({
    startTour,
    stopTour,
    nextStep,
    previousStep,
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
  }), [isActive, currentStep, currentStepIndex, steps.length]);

  return (
    <CoachmarkContext.Provider value={value}>
      {children}
      <Coachmark
        step={currentStep}
        isActive={isActive}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={stopTour}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
      />
    </CoachmarkContext.Provider>
  );
}
