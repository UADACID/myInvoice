import { useState, useMemo, useEffect } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useSettings } from '@/hooks/useSettings';
import { invoiceService } from '@/storage/services';
import { generateInvoicePdf } from '@/pdf/invoicePdf';
import { Table, TableRow, TableCell, Button, Card, CardContent, Modal, Input, Select } from '@/components';
import { getInvoiceType } from '@/utils/invoiceCompat';
import type { Invoice } from '@/domain/types';

type SortKey = 'invoiceNumber' | 'client' | 'total' | 'issueDate' | 'dueDate' | null;
type SortDirection = 'asc' | 'desc' | null;

export function InvoicesPage() {
  const { invoices, loading } = useInvoices();
  const { clients } = useClients();
  const { settings } = useSettings();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Tab state for recurring invoices
  const [selectedProjectTab, setSelectedProjectTab] = useState<string | null>(null);

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.companyName || 'Unknown';
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    if (!settings) {
      alert('Please configure settings first');
      return;
    }

    setDownloading(invoiceId);
    try {
      const invoice = await invoiceService.getById(invoiceId);
      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      const clientData = clients.find((c) => c.id === invoice.clientId);
      if (!clientData) {
        alert('Client data not found');
        return;
      }

      const { pdfBytes, filename } = await generateInvoicePdf(invoice, clientData, settings);

      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate PDF';
      alert(`Error: ${message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (invoiceId: string) => {
    if (!settings) {
      alert('Please configure settings first');
      return;
    }

    setPreviewLoading(true);
    try {
      const invoice = await invoiceService.getById(invoiceId);
      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      const clientData = clients.find((c) => c.id === invoice.clientId);
      if (!clientData) {
        alert('Client data not found');
        return;
      }

      const { pdfBytes } = await generateInvoicePdf(invoice, clientData, settings);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setPreviewInvoice(invoice);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate PDF preview';
      alert(`Error: ${message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewInvoice(null);
    setPreviewUrl(null);
  };

  // Separate invoices: recurring (from contracts) vs custom (with items)
  const baseRecurringInvoices = useMemo(() =>
    invoices.filter(inv => getInvoiceType(inv) === 'recurring'),
    [invoices]
  );
  const baseCustomInvoices = useMemo(() =>
    invoices.filter(inv => getInvoiceType(inv) === 'custom'),
    [invoices]
  );

  // Group recurring invoices by project (clientId)
  const projectsWithInvoices = useMemo(() => {
    const grouped: Record<string, { clientId: string; invoices: Invoice[] }> = {};

    baseRecurringInvoices.forEach((invoice) => {
      if (!grouped[invoice.clientId]) {
        grouped[invoice.clientId] = {
          clientId: invoice.clientId,
          invoices: [],
        };
      }
      grouped[invoice.clientId].invoices.push(invoice);
    });

    // Convert to array and sort by client name
    return Object.values(grouped)
      .map((group) => ({
        ...group,
        clientName: getClientName(group.clientId),
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [baseRecurringInvoices, clients]);

  // Set default selected tab to first project
  useEffect(() => {
    if (projectsWithInvoices.length > 0 && !selectedProjectTab) {
      setSelectedProjectTab(projectsWithInvoices[0].clientId);
    }
  }, [projectsWithInvoices.length, selectedProjectTab]);

  // Get invoices for selected project
  const selectedProjectInvoices = useMemo(() => {
    if (!selectedProjectTab) return [];
    const project = projectsWithInvoices.find(p => p.clientId === selectedProjectTab);
    return project?.invoices || [];
  }, [selectedProjectTab, projectsWithInvoices]);

  // Filter and search function
  const filterAndSearch = (invoiceList: Invoice[]) => {
    return invoiceList.filter((invoice) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientName = getClientName(invoice.clientId).toLowerCase();
        const invoiceNum = invoice.invoiceNumber.toLowerCase();
        const total = invoice.total.toString();

        if (
          !clientName.includes(query) &&
          !invoiceNum.includes(query) &&
          !total.includes(query)
        ) {
          return false;
        }
      }

      // Client filter
      if (filterClient && invoice.clientId !== filterClient) {
        return false;
      }

      // Date range filter
      if (filterDateFrom && invoice.issueDate < filterDateFrom) {
        return false;
      }
      if (filterDateTo && invoice.issueDate > filterDateTo) {
        return false;
      }

      return true;
    });
  };

  // Sort function
  const sortInvoices = (invoiceList: Invoice[]) => {
    if (!sortKey || !sortDirection) return invoiceList;

    const sorted = [...invoiceList].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortKey) {
        case 'invoiceNumber':
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
          break;
        case 'client':
          aValue = getClientName(a.clientId);
          bValue = getClientName(b.clientId);
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'issueDate':
          aValue = a.issueDate;
          bValue = b.issueDate;
          break;
        case 'dueDate':
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return sorted;
  };

  // Apply filters and sorting for selected project
  const filteredRecurringInvoices = useMemo(() => {
    const filtered = filterAndSearch(selectedProjectInvoices);
    return sortInvoices(filtered);
  }, [selectedProjectInvoices, searchQuery, filterClient, filterDateFrom, filterDateTo, sortKey, sortDirection, clients]);

  // Apply filters and sorting for custom invoices
  const customInvoices = useMemo(() => {
    const filtered = filterAndSearch(baseCustomInvoices);
    return sortInvoices(filtered);
  }, [baseCustomInvoices, searchQuery, filterClient, filterDateFrom, filterDateTo, sortKey, sortDirection, clients]);

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-slate-400">Loading</span></div>;
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key as SortKey);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterClient('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSortKey(null);
    setSortDirection(null);
  };

  const renderInvoiceTable = (invoiceList: Invoice[], emptyMessage: string) => {
    if (invoiceList.length === 0) {
      return (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">{emptyMessage}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const tableHeaders = [
      { label: 'Invoice Number', sortable: true, key: 'invoiceNumber' },
      { label: 'Client', sortable: true, key: 'client' },
      { label: 'Total', sortable: true, key: 'total' },
      { label: 'Issue Date', sortable: true, key: 'issueDate' },
      { label: 'Due Date', sortable: true, key: 'dueDate' },
      { label: 'Actions', sortable: false },
    ];

    return (
      <Table
        headers={tableHeaders}
        sortKey={sortKey || undefined}
        sortDirection={sortDirection || undefined}
        onSort={handleSort}
        data-coachmark="invoice-table"
      >
        {invoiceList.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.invoiceNumber}</TableCell>
            <TableCell>{getClientName(invoice.clientId)}</TableCell>
            <TableCell className="font-medium">{invoice.total.toLocaleString()}</TableCell>
            <TableCell>{invoice.issueDate}</TableCell>
            <TableCell>{invoice.dueDate}</TableCell>
            <TableCell>
              <div className="flex gap-4">
                <button
                  onClick={() => handlePreview(invoice.id)}
                  disabled={previewLoading || !settings}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors disabled:opacity-40"
                  data-coachmark="preview-btn"
                >
                  {previewLoading ? 'Loading...' : 'Preview'}
                </button>
                <button
                  onClick={() => handleDownloadPdf(invoice.id)}
                  disabled={downloading === invoice.id || !settings}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors disabled:opacity-40"
                >
                  {downloading === invoice.id ? 'Generating...' : 'PDF'}
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    );
  };

  const hasActiveFilters = searchQuery || filterClient || filterDateFrom || filterDateTo;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">Invoices</h1>
        <p className="text-[var(--text-muted)] text-sm">View all invoices. Preview and download PDFs. To generate or create invoices, go to a contract (Clients → View → Contract → View).</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Search"
                  type="text"
                  placeholder="Search by invoice number, client, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Select
                  label="Client"
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  options={[
                    { label: 'All Clients', value: '' },
                    ...clients.map(client => ({
                      label: client.companyName,
                      value: client.id
                    }))
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2.5">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    placeholder="From"
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    placeholder="To"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
                <span className="text-sm text-[var(--text-muted)]">
                  {filteredRecurringInvoices.length + customInvoices.length} result(s) found
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recurring Invoices Section - read-only */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">
            Recurring Invoices
            {baseRecurringInvoices.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                ({baseRecurringInvoices.length} total)
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Generated from contracts. To generate for a year, open a contract and use &quot;Generate for Year&quot;.</p>
        </div>

        {projectsWithInvoices.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No recurring invoices. Generate invoices from your contracts.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Project Tabs */}
            <div className="mb-4 border-b border-[var(--border-color)]">
              <div className="flex gap-2 overflow-x-auto">
                {projectsWithInvoices.map((project) => (
                  <button
                    key={project.clientId}
                    onClick={() => setSelectedProjectTab(project.clientId)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${selectedProjectTab === project.clientId
                      ? 'text-[var(--color-primary)] bg-[var(--color-primary-bkg)] border-b-2 border-[var(--color-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                      }`}
                  >
                    {project.clientName}
                    <span className="ml-2 text-xs opacity-70">({project.invoices.length})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table for selected project */}
            {selectedProjectTab && (
              <div>
                {filteredRecurringInvoices.length === 0 ? (
                  <Card>
                    <CardContent>
                      <div className="text-center py-12">
                        <p className="text-slate-500 text-sm">
                          No invoices found for {projectsWithInvoices.find(p => p.clientId === selectedProjectTab)?.clientName}
                          {searchQuery || filterDateFrom || filterDateTo ? ' (try adjusting filters)' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  renderInvoiceTable(filteredRecurringInvoices, '')
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Invoices Section - read-only */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">
            Custom Invoices
            {customInvoices.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                ({customInvoices.length})
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manually created invoices with custom line items. To create one, open a contract and use &quot;Create Custom Invoice&quot;.</p>
        </div>
        {renderInvoiceTable(customInvoices, 'No custom invoices.')}
      </div>

      <Modal
        isOpen={previewInvoice !== null}
        onClose={handleClosePreview}
        title={previewInvoice ? `Invoice Preview - ${previewInvoice.invoiceNumber}` : ''}
        className="max-w-5xl"
      >
        {previewUrl && (
          <div className="w-full h-[calc(90vh-120px)]">
            <iframe
              src={previewUrl}
              className="w-full h-full border border-slate-200 rounded-lg"
              title="Invoice Preview"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
