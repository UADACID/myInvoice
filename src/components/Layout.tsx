import { type ReactNode, useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

type Page = 'settings' | 'clients' | 'contracts' | 'invoices' | 'backup';

export function Layout({ children }: LayoutProps) {
  const [currentPage, setCurrentPage] = useState<Page>('invoices');

  const pages: { id: Page; label: string }[] = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'clients', label: 'Clients' },
    { id: 'settings', label: 'Settings' },
    { id: 'backup', label: 'Backup' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-[var(--text-main)]">Invoice Generator</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPage(page.id)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${currentPage === page.id
                      ? 'border-[var(--color-primary)] text-[var(--text-main)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)]'
                      }`}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}

// Export navigation context for child components
export { type Page };
