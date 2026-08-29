export const PAGE_IDS = [
  'settings',
  'clients',
  'client-detail',
  'contract-detail',
  'invoices',
  'create-invoice',
  'backup',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

export type NavigateOptions = {
  page: PageId;
  clientId?: string;
  contractId?: string;
};

export const paths = {
  home: () => '/clients',
  clients: () => '/clients',
  client: (clientId: string) => `/clients/${clientId}`,
  contract: (clientId: string, contractId: string) => `/clients/${clientId}/contracts/${contractId}`,
  createInvoice: (clientId: string, contractId: string) =>
    `/clients/${clientId}/contracts/${contractId}/invoices/new`,
  invoices: () => '/invoices',
  settings: () => '/settings',
  backup: () => '/backup',
};

export function pageToPath(page: PageId, clientId?: string, contractId?: string): string {
  switch (page) {
    case 'settings':
      return paths.settings();
    case 'backup':
      return paths.backup();
    case 'invoices':
      return paths.invoices();
    case 'clients':
      return paths.clients();
    case 'client-detail':
      return clientId ? paths.client(clientId) : paths.clients();
    case 'contract-detail':
      return clientId && contractId ? paths.contract(clientId, contractId) : paths.clients();
    case 'create-invoice':
      return clientId && contractId
        ? paths.createInvoice(clientId, contractId)
        : clientId
          ? paths.client(clientId)
          : paths.invoices();
    default:
      return paths.clients();
  }
}

export function pathnameToPageId(pathname: string): PageId {
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/backup')) return 'backup';
  if (pathname === '/invoices') return 'invoices';
  if (pathname.includes('/invoices/new')) return 'create-invoice';
  if (pathname.includes('/contracts/')) return 'contract-detail';
  if (/^\/clients\/[^/]+$/.test(pathname)) return 'client-detail';
  if (pathname.startsWith('/clients')) return 'clients';
  return 'clients';
}

export function parsePathParams(pathname: string): { clientId?: string; contractId?: string } {
  const clientMatch = pathname.match(/^\/clients\/([^/]+)/);
  const contractMatch = pathname.match(/\/contracts\/([^/]+)/);
  return {
    clientId: clientMatch?.[1],
    contractId: contractMatch?.[1],
  };
}
