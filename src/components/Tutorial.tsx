import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetPage?: string;
  highlight?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Invoice Generator!',
    description: 'This is a local-first invoice generator. All your data stays on your device. Let\'s get started!',
  },
  {
    id: 'settings',
    title: 'Step 1: Configure Settings',
    description: 'First, go to Settings and fill in your freelancer information, bank details, and PDF filename template. This information will be used in all your invoices.',
    targetPage: 'settings',
  },
  {
    id: 'clients',
    title: 'Step 2: Add Clients',
    description: 'Add your clients by going to the Clients page. You\'ll need at least one client before creating contracts.',
    targetPage: 'clients',
  },
  {
    id: 'contracts',
    title: 'Step 3: Create Contracts',
    description: 'Create contracts for each client. Contracts define the recurring service details (description, price, currency, quantity). Use {{month}} and {{year}} in descriptions for dynamic dates.',
    targetPage: 'contracts',
  },
  {
    id: 'invoices',
    title: 'Step 4: Generate Invoices',
    description: 'Once you have contracts, generate invoices for the year. You can preview, download PDFs, or delete invoices as needed.',
    targetPage: 'invoices',
  },
  {
    id: 'backup',
    title: 'Step 5: Backup Your Data',
    description: 'Regularly export your data to JSON files. You can import them later to restore everything. Your data is stored locally in your browser.',
    targetPage: 'backup',
  },
];

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Tutorial({ isOpen, onClose, currentPage, onNavigate }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsCompleted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsCompleted(true);
      localStorage.setItem('tutorial_completed', 'true');
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
      
      // Navigate to target page if specified
      if (step.targetPage && onNavigate && currentPage !== step.targetPage) {
        onNavigate(step.targetPage);
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true');
    onClose();
  };

  if (isCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="max-w-2xl w-full mx-4">
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900">{step.title}</h2>
              <span className="text-sm text-slate-500">
                {currentStep + 1} / {tutorialSteps.length}
              </span>
            </div>
            <p className="text-slate-600 text-base leading-relaxed">{step.description}</p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip Tutorial
            </button>
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {isLastStep ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted) {
      // Show tutorial after a short delay on first visit
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return {
    showTutorial,
    startTutorial,
    closeTutorial,
  };
}
