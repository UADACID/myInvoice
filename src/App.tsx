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

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button type="button" onClick={() => handlePageChange('clients')} className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg">
              <Logo />
            </button>
            
            {/* Desktop Menu - Clients first (home), then Contracts, Invoices, Settings, Backup */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handlePageChange('clients')}
                data-coachmark="clients-nav"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'clients'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => handlePageChange('contracts')}
                data-coachmark="contracts-nav"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'contracts'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Contracts
              </button>
              <button
                onClick={() => handlePageChange('invoices')}
                data-coachmark="invoices-nav"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'invoices'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => handlePageChange('settings')}
                data-coachmark="settings-nav"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'settings'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => handlePageChange('backup')}
                data-coachmark="backup-nav"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'backup'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Backup
              </button>
              <button
                onClick={handlePrivacyClick}
                data-coachmark="privacy-nav"
                className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                Privacy
              </button>
              <button
                onClick={startTutorial}
                className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                title="Show Tutorial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={startCoachmark}
                className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                title="Start Guided Tour"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={startTutorial}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Show Tutorial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
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
            <div className="md:hidden border-t border-slate-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => handlePageChange('clients')}
                  data-coachmark="clients-nav"
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 'clients'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => handlePageChange('contracts')}
                  data-coachmark="contracts-nav"
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 'contracts'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Contracts
                </button>
                <button
                  onClick={() => handlePageChange('invoices')}
                  data-coachmark="invoices-nav"
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 'invoices'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => handlePageChange('settings')}
                  data-coachmark="settings-nav"
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 'settings'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Settings
                </button>
                <button
                  onClick={() => handlePageChange('backup')}
                  data-coachmark="backup-nav"
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 'backup'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Backup
                </button>
                <button
                  onClick={handlePrivacyClick}
                  data-coachmark="privacy-nav"
                  className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                >
                  Privacy
                </button>
                <button
                  onClick={() => {
                    startCoachmark();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
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
