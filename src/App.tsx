import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { ClientDetailPage } from '@/features/clients/ClientDetailPage';
import { ContractDetailPage } from '@/features/contracts/ContractDetailPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { CreateInvoicePage } from '@/features/invoices/CreateInvoicePage';
import { BackupPage } from '@/features/backup/BackupPage';
import { PrivacyContent } from '@/features/privacy/PrivacyPage';
import { Tutorial, useTutorial } from '@/components/Tutorial';
import { CoachmarkProvider, useCoachmarkContext } from '@/components/CoachmarkProvider';
import { Logo, Modal } from '@/components';
import { coachmarkSteps } from '@/config/coachmarkSteps';
import { useSettings } from '@/hooks/useSettings';
import { isFreelancerInfoComplete } from '@/utils/freelancerInfo';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { PAGE_IDS, pageToPath, type NavigateOptions, type PageId } from '@/navigation/routes';

const SETUP_REDIRECT_KEY = 'setup_redirect_done';

function ClientDetailRoute() {
  const { clientId } = useParams();
  return <ClientDetailPage clientId={clientId ?? null} />;
}

function ContractDetailRoute() {
  const { contractId } = useParams();
  return <ContractDetailPage contractId={contractId ?? null} />;
}

function CreateInvoiceRoute() {
  const { clientId, contractId } = useParams();
  return <CreateInvoicePage initialClientId={clientId ?? null} initialContractId={contractId ?? null} />;
}

function AppContent() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { showTutorial, startTutorial, closeTutorial } = useTutorial();
  const { startTour: startCoachmark } = useCoachmarkContext();
  const { navigateToPage, goToClientsNav, currentPageId } = useAppNavigation();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const handleNavigate = (e: CustomEvent<NavigateOptions>) => {
      const page = e.detail?.page;
      if (page && PAGE_IDS.includes(page)) {
        navigateToPage(page, e.detail?.clientId, e.detail?.contractId);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, [navigateToPage]);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handlePageChange = (page: PageId) => {
    navigateToPage(page);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  const handleClientsNavClick = () => {
    goToClientsNav();
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  const handlePrivacyClick = () => {
    setShowPrivacyModal(true);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  const isMorePageActive = currentPageId === 'settings' || currentPageId === 'backup';

  const navLinkClass = (page: PageId) => {
    const isActive =
      page === 'clients'
        ? ['clients', 'client-detail', 'contract-detail', 'create-invoice'].includes(currentPageId)
        : currentPageId === page;
    return `px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
      ? 'text-[var(--color-primary)] bg-[var(--color-primary-bkg)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
      }`;
  };

  const moreItemClass = (active: boolean) =>
    `w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'text-[var(--color-primary)] bg-[var(--color-primary-bkg)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
    }`;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-300">
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button type="button" onClick={handleClientsNavClick} className="focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded-lg">
              <Logo />
            </button>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={handleClientsNavClick} data-coachmark="clients-nav" className={navLinkClass('clients')}>Clients</button>
              <button onClick={() => handlePageChange('invoices')} data-coachmark="invoices-nav" className={navLinkClass('invoices')}>Invoices</button>

              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen((open) => !open)}
                  data-coachmark="more-nav"
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isMorePageActive || moreMenuOpen
                      ? 'text-[var(--color-primary)] bg-[var(--color-primary-bkg)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                  }`}
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="true"
                >
                  More
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg p-1.5 z-50">
                    <button onClick={() => handlePageChange('settings')} data-coachmark="settings-nav" className={moreItemClass(currentPageId === 'settings')}>Settings</button>
                    <button onClick={() => handlePageChange('backup')} data-coachmark="backup-nav" className={moreItemClass(currentPageId === 'backup')}>Backup</button>
                    <button onClick={handlePrivacyClick} data-coachmark="privacy-nav" className={moreItemClass(false)}>Privacy</button>
                    <div className="my-1 h-px bg-[var(--border-color)]" />
                    <button
                      onClick={() => {
                        startTutorial();
                        setMoreMenuOpen(false);
                      }}
                      className={moreItemClass(false)}
                    >
                      Tutorial
                    </button>
                    <button
                      onClick={() => {
                        startCoachmark();
                        setMoreMenuOpen(false);
                      }}
                      className={moreItemClass(false)}
                    >
                      Guided Tour
                    </button>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>

              <button onClick={toggleTheme} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-lg transition-colors" title="Toggle Theme">
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
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

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[var(--border-color)]">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={handleClientsNavClick} data-coachmark="clients-nav" className={`w-full text-left ${navLinkClass('clients')}`}>Clients</button>
                <button onClick={() => handlePageChange('invoices')} data-coachmark="invoices-nav" className={`w-full text-left ${navLinkClass('invoices')}`}>Invoices</button>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">More</div>
                <button onClick={() => handlePageChange('settings')} data-coachmark="settings-nav" className={`w-full text-left ${navLinkClass('settings')}`}>Settings</button>
                <button onClick={() => handlePageChange('backup')} data-coachmark="backup-nav" className={`w-full text-left ${navLinkClass('backup')}`}>Backup</button>
                <button onClick={handlePrivacyClick} data-coachmark="privacy-nav" className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]">Privacy</button>
                <button
                  onClick={() => {
                    startTutorial();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)]"
                >
                  Tutorial
                </button>
                <button
                  onClick={() => {
                    startCoachmark();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bkg)]"
                >
                  Guided Tour
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Routes>
          <Route path="/" element={<Navigate to="/clients" replace />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailRoute />} />
          <Route path="/clients/:clientId/contracts/:contractId" element={<ContractDetailRoute />} />
          <Route path="/clients/:clientId/contracts/:contractId/invoices/new" element={<CreateInvoiceRoute />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </main>

      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-[var(--text-muted)] gap-2">
            <div>
              &copy; {new Date().getFullYear()} <a href="https://github.com/UADACID" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-main)] transition-colors">UADACID</a>
            </div>
            <div>
              Project: <a href="https://github.com/UADACID/myInvoice" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-main)] transition-colors">myInvoice</a>
            </div>
          </div>
        </div>
      </footer>

      <Tutorial
        isOpen={showTutorial}
        onClose={closeTutorial}
        currentPage={currentPageId}
        onNavigate={(page) => handlePageChange(page as PageId)}
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

function SetupRedirect() {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    if (settingsLoading) return;
    if (localStorage.getItem(SETUP_REDIRECT_KEY)) return;
    if (!isFreelancerInfoComplete(settings)) {
      localStorage.setItem(SETUP_REDIRECT_KEY, 'true');
      navigate(pageToPath('settings'));
    }
  }, [settings, settingsLoading, navigate]);

  return null;
}

function AppShell() {
  const { currentPageId, navigateToPage } = useAppNavigation();

  return (
    <>
      <SetupRedirect />
      <CoachmarkProvider
        steps={coachmarkSteps}
        currentPage={currentPageId}
        onNavigate={(page: string) => navigateToPage(page as PageId)}
      >
        <AppContent />
      </CoachmarkProvider>
    </>
  );
}

function App() {
  return <AppShell />;
}

export default App;
export type { NavigateOptions, PageId };
