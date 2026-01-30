import { useState, useEffect } from 'react';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { ContractsPage } from '@/features/contracts/ContractsPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { CreateInvoicePage } from '@/features/invoices/CreateInvoicePage';
import { BackupPage } from '@/features/backup/BackupPage';
import { PrivacyContent } from '@/features/privacy/PrivacyPage';
import { Tutorial, useTutorial } from '@/components/Tutorial';
import { CoachmarkProvider, useCoachmarkContext } from '@/components/CoachmarkProvider';
import { Modal } from '@/components';
import { coachmarkSteps } from '@/config/coachmarkSteps';

type Page = 'settings' | 'clients' | 'contracts' | 'invoices' | 'create-invoice' | 'backup';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('invoices');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { showTutorial, startTutorial, closeTutorial } = useTutorial();
  const { startTour: startCoachmark } = useCoachmarkContext();

  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      const page = e.detail?.page;
      if (page && ['settings', 'clients', 'contracts', 'invoices', 'create-invoice', 'backup'].includes(page)) {
        setCurrentPage(page as Page);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'settings':
        return <SettingsPage />;
      case 'clients':
        return <ClientsPage />;
      case 'contracts':
        return <ContractsPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'create-invoice':
        return <CreateInvoicePage />;
      case 'backup':
        return <BackupPage />;
      default:
        return <InvoicesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            <div className="text-lg font-semibold text-slate-900">MyInvoice</div>
            <div className="flex items-center gap-2">
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
                onClick={() => setShowPrivacyModal(true)}
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
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
  const [currentPage, setCurrentPage] = useState<Page>('invoices');

  return (
    <CoachmarkProvider
      steps={coachmarkSteps}
      currentPage={currentPage}
      onNavigate={(page: string) => {
        setCurrentPage(page as Page);
      }}
    >
      <AppContent />
    </CoachmarkProvider>
  );
}

export default App;
