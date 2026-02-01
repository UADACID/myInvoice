import { useState, useEffect } from 'react';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { ClientDetailPage } from '@/features/clients/ClientDetailPage';
import { ContractsPage } from '@/features/contracts/ContractsPage';
import { ContractDetailPage } from '@/features/contracts/ContractDetailPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { CreateInvoicePage } from '@/features/invoices/CreateInvoicePage';
import { BackupPage } from '@/features/backup/BackupPage';
import { PrivacyContent } from '@/features/privacy/PrivacyPage';
import { Tutorial, useTutorial } from '@/components/Tutorial';
import { CoachmarkProvider, useCoachmarkContext } from '@/components/CoachmarkProvider';
import { Logo, Modal } from '@/components';
import { coachmarkSteps } from '@/config/coachmarkSteps';

const PAGE_VALUES = ['settings', 'clients', 'client-detail', 'contracts', 'contract-detail', 'invoices', 'create-invoice', 'backup'] as const;
type Page = (typeof PAGE_VALUES)[number];

export type NavigateOptions = { page: Page; clientId?: string; contractId?: string };

function AppContent({
  currentPage,
  contextClientId,
  contextContractId,
  onNavigate,
}: {
  currentPage: Page;
  contextClientId: string | null;
  contextContractId: string | null;
  onNavigate: (page: Page, clientId?: string, contractId?: string) => void;
}) {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showTutorial, startTutorial, closeTutorial } = useTutorial();
  const { startTour: startCoachmark } = useCoachmarkContext();

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const handleNavigate = (e: CustomEvent<NavigateOptions>) => {
      const page = e.detail?.page;
      if (page && PAGE_VALUES.includes(page)) {
        onNavigate(page, e.detail?.clientId, e.detail?.contractId);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, [onNavigate]);

  useEffect(() => {
    // Remove both first to avoid conflicts
    document.documentElement.classList.remove('dark', 'light');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handlePageChange = (page: Page) => {
    onNavigate(page);
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const handlePrivacyClick = () => {
    setShowPrivacyModal(true);
    setMobileMenuOpen(false); // Close mobile menu when opening privacy modal
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'settings':
        return <SettingsPage />;
      case 'clients':
        return <ClientsPage />;
      case 'client-detail':
        return <ClientDetailPage clientId={contextClientId} onNavigate={(page, clientId, contractId) => onNavigate(page as Page, clientId, contractId)} />;
      case 'contracts':
        return <ContractsPage />;
      case 'contract-detail':
        return <ContractDetailPage contractId={contextContractId} onNavigate={(page, clientId, contractId) => onNavigate(page as Page, clientId, contractId)} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'create-invoice':
        return <CreateInvoicePage initialClientId={contextClientId} initialContractId={contextContractId} />;
      case 'backup':
        return <BackupPage />;
      default:
        return <ClientsPage />;
    }
  };

  const navLinkClass = (page: Page) => `px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page
    ? 'text-[var(--color-primary)] bg-[var(--color-primary-bkg)]'
    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
    }`;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-300">
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button type="button" onClick={() => handlePageChange('clients')} className="focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded-lg">
              <Logo />
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => handlePageChange('clients')} data-coachmark="clients-nav" className={navLinkClass('clients')}>Clients</button>
              <button onClick={() => handlePageChange('contracts')} data-coachmark="contracts-nav" className={navLinkClass('contracts')}>Contracts</button>
              <button onClick={() => handlePageChange('invoices')} data-coachmark="invoices-nav" className={navLinkClass('invoices')}>Invoices</button>
              <button onClick={() => handlePageChange('settings')} data-coachmark="settings-nav" className={navLinkClass('settings')}>Settings</button>
              <button onClick={() => handlePageChange('backup')} data-coachmark="backup-nav" className={navLinkClass('backup')}>Backup</button>
              <button onClick={handlePrivacyClick} data-coachmark="privacy-nav" className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]">Privacy</button>

              <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>

              <button onClick={toggleTheme} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-lg transition-colors" title="Toggle Theme">
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              <button onClick={startTutorial} className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)]" title="Show Tutorial">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button onClick={startCoachmark} className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)]" title="Start Guided Tour">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <button
                onClick={startTutorial}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)] rounded-lg transition-colors"
                title="Show Tutorial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[var(--border-color)]">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={() => handlePageChange('clients')} data-coachmark="clients-nav" className={`w-full text-left ${navLinkClass('clients')}`}>Clients</button>
                <button onClick={() => handlePageChange('contracts')} data-coachmark="contracts-nav" className={`w-full text-left ${navLinkClass('contracts')}`}>Contracts</button>
                <button onClick={() => handlePageChange('invoices')} data-coachmark="invoices-nav" className={`w-full text-left ${navLinkClass('invoices')}`}>Invoices</button>
                <button onClick={() => handlePageChange('settings')} data-coachmark="settings-nav" className={`w-full text-left ${navLinkClass('settings')}`}>Settings</button>
                <button onClick={() => handlePageChange('backup')} data-coachmark="backup-nav" className={`w-full text-left ${navLinkClass('backup')}`}>Backup</button>
                <button onClick={handlePrivacyClick} data-coachmark="privacy-nav" className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]">Privacy</button>
                <button
                  onClick={() => {
                    startCoachmark();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)]"
                >
                  Start Guided Tour
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {renderPage()}
      </main>

      <Tutorial
        isOpen={showTutorial}
        onClose={closeTutorial}
        currentPage={currentPage}
        onNavigate={(page) => handlePageChange(page as Page)}
      />

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy & Security"
        className="max-w-4xl"
      >
        <PrivacyContent />
      </Modal>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('clients');
  const [contextClientId, setContextClientId] = useState<string | null>(null);
  const [contextContractId, setContextContractId] = useState<string | null>(null);

  const handleNavigate = (page: Page, clientId?: string, contractId?: string) => {
    setCurrentPage(page);
    setContextClientId(clientId ?? null);
    setContextContractId(contractId ?? null);
  };

  return (
    <CoachmarkProvider
      steps={coachmarkSteps}
      currentPage={currentPage}
      onNavigate={(page: string) => handleNavigate(page as Page)}
    >
      <AppContent
        currentPage={currentPage}
        contextClientId={contextClientId}
        contextContractId={contextContractId}
        onNavigate={handleNavigate}
      />
    </CoachmarkProvider>
  );
}

export default App;
