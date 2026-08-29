import { useState, useMemo } from 'react';
import { useContract } from '@/hooks/useContract';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useSettings } from '@/hooks/useSettings';
import { invoiceService } from '@/storage/services';
import { generateInvoicesForYear } from '@/services/invoiceService';
import { generateInvoicePdf } from '@/pdf/invoicePdf';
import { Button, Card, CardContent, Table, TableRow, TableCell, Modal, GenerateYearOverlay } from '@/components';
import type { GenerateYearPhase, GenerateYearProgress, GenerateYearResult } from '@/components';
import type { Invoice } from '@/domain/types';
import { FREELANCER_INFO_REQUIRED_MESSAGE, isFreelancerInfoComplete } from '@/utils/freelancerInfo';
import { getInvoiceType } from '@/utils/invoiceCompat';
import { useAppNavigation } from '@/navigation/useAppNavigation';

type InvoiceTab = 'recurring' | 'custom';

const tabButtonClass = (active: boolean) =>
  `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
    active
      ? 'text-[var(--color-primary)] bg-[var(--color-primary-bkg)] border-b-2 border-[var(--color-primary)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
  }`;

export interface ContractDetailPageProps {
  contractId: string | null;
}

export function ContractDetailPage({ contractId }: ContractDetailPageProps) {
  const { navigateToPage } = useAppNavigation();
  const { contract, loading } = useContract(contractId);
  const { invoices, refreshInvoices } = useInvoices();
  const { clients } = useClients();
  const { settings } = useSettings();
  const [generatePhase, setGeneratePhase] = useState<GenerateYearPhase | 'idle'>('idle');
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [generateProgress, setGenerateProgress] = useState<GenerateYearProgress>({
    current: 0,
    total: 12,
    monthLabel: '',
  });
  const [generateResult, setGenerateResult] = useState<GenerateYearResult | undefined>();
  const [generateError, setGenerateError] = useState<string | undefined>();
  const generating = generatePhase !== 'idle';
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [invoiceTab, setInvoiceTab] = useState<InvoiceTab>('recurring');

  const freelancerReady = isFreelancerInfoComplete(settings);

  const contractInvoices = useMemo(
    () => (contractId ? invoices.filter((inv) => inv.contractId === contractId) : []),
    [invoices, contractId]
  );

  const recurringInvoices = useMemo(
    () =>
      contractInvoices
        .filter((inv) => getInvoiceType(inv) === 'recurring')
        .sort((a, b) => a.issueDate.localeCompare(b.issueDate)),
    [contractInvoices]
  );

  const customInvoices = useMemo(
    () =>
      contractInvoices
        .filter((inv) => getInvoiceType(inv) === 'custom')
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [contractInvoices]
  );

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.companyName ?? 'Unknown';

  const requireFreelancerInfo = (): boolean => {
    if (freelancerReady) return true;
    alert(FREELANCER_INFO_REQUIRED_MESSAGE);
    navigateToPage('settings');
    return false;
  };

  const closeGenerateOverlay = () => {
    setGeneratePhase('idle');
    setGenerateResult(undefined);
    setGenerateError(undefined);
    setGenerateProgress({ current: 0, total: 12, monthLabel: '' });
  };

  const handleGenerateForYear = async () => {
    if (!contractId) return;
    if (!requireFreelancerInfo()) return;
    const year = new Date().getFullYear();
    if (!confirm(`Generate recurring invoices for ${year}? Existing invoices for this contract will be updated if data changed.`)) return;

    setGenerateYear(year);
    setGenerateProgress({ current: 0, total: 12, monthLabel: '' });
    setGenerateResult(undefined);
    setGenerateError(undefined);
    setGeneratePhase('generating');

    try {
      const result = await generateInvoicesForYear(contractId, year, (current, total, monthLabel) => {
        setGenerateProgress({ current, total, monthLabel });
      });

      const summary: GenerateYearResult = {
        created: result.created.length,
        updated: result.updated,
        skipped: result.skipped,
      };
      setGenerateResult(summary);
      setGeneratePhase('success');
      refreshInvoices();
      setInvoiceTab('recurring');

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const parts: string[] = [];
      if (result.created.length > 0) parts.push(`Created ${result.created.length} new`);
      if (result.updated > 0) parts.push(`Updated ${result.updated}`);
      if (result.skipped > 0) parts.push(`Skipped ${result.skipped} unchanged`);
      alert(parts.length > 0 ? parts.join(', ') + '.' : 'No invoices generated.');

      closeGenerateOverlay();
    } catch (error) {
      console.error('Error generating invoices:', error);
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate invoices');
      setGeneratePhase('error');
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    if (!requireFreelancerInfo() || !settings) return;
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
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (invoiceId: string) => {
    if (!requireFreelancerInfo() || !settings) return;
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
      console.error('Error generating preview:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewInvoice(null);
    setPreviewUrl(null);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoiceService.delete(id);
      refreshInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleCreateCustomInvoice = () => {
    if (!contract) return;
    if (!requireFreelancerInfo()) return;
    navigateToPage('create-invoice', contract.clientId, contractId ?? undefined);
  };

  if (!contractId) {
    return (
      <div>
        <Button type="button" variant="secondary" onClick={() => navigateToPage('clients')} className="mb-4">
          Back to Clients
        </Button>
        <p className="text-[var(--text-muted)]">No contract selected. Open a client, then click View on a contract.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-[var(--text-muted)]">Loading</span></div>;
  }

  if (!contract) {
    return (
      <div>
        <Button type="button" variant="secondary" onClick={() => navigateToPage('clients')} className="mb-4">
          Back to Clients
        </Button>
        <p className="text-[var(--text-muted)]">Contract not found.</p>
      </div>
    );
  }

  const clientName = getClientName(contract.clientId);

  const renderInvoiceTable = (invoiceList: Invoice[], emptyMessage: string) => {
    if (invoiceList.length === 0) {
      return (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">{emptyMessage}</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Table headers={['Invoice Number', 'Issue Date', 'Due Date', 'Total', 'Actions']}>
        {invoiceList.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell>{inv.invoiceNumber}</TableCell>
            <TableCell>{inv.issueDate}</TableCell>
            <TableCell>{inv.dueDate}</TableCell>
            <TableCell className="font-medium">{inv.total.toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex gap-4">
                <button
                  onClick={() => handlePreview(inv.id)}
                  disabled={previewLoading || !freelancerReady}
                  className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium disabled:opacity-40"
                >
                  {previewLoading ? 'Loading…' : 'Preview'}
                </button>
                <button
                  onClick={() => handleDownloadPdf(inv.id)}
                  disabled={downloading === inv.id || !freelancerReady}
                  className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium disabled:opacity-40"
                >
                  {downloading === inv.id ? 'Generating…' : 'PDF'}
                </button>
                <button
                  onClick={() => handleDeleteInvoice(inv.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    );
  };

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-1 text-sm text-[var(--text-muted)] mb-4" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigateToPage('clients')}
          className="hover:text-[var(--text-main)] transition-colors"
        >
          Clients
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          onClick={() => navigateToPage('client-detail', contract.clientId)}
          className="hover:text-[var(--text-main)] transition-colors"
        >
          {clientName}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--text-main)]">Contract</span>
      </nav>

      <Button
        type="button"
        variant="secondary"
        onClick={() => navigateToPage('client-detail', contract.clientId)}
        className="mb-6"
      >
        Back to Client
      </Button>

      <Card className="mb-8">
        <CardContent>
          <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-2">Contract</h1>
          <p className="text-[var(--text-muted)] text-sm mb-1"><strong>Client:</strong> {clientName}</p>
          <p className="text-[var(--text-muted)] text-sm mb-1"><strong>Description:</strong> {contract.descriptionTemplate}</p>
          <p className="text-[var(--text-muted)] text-sm mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              <strong>Amount:</strong>{' '}
              {showAmount ? (
                <>
                  {contract.unitPrice.toLocaleString()} {contract.currency} × {contract.quantity}
                </>
              ) : (
                <span className="tracking-widest text-[var(--text-main)]" aria-label="Amount hidden">
                  •••••• {contract.currency} × •
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowAmount((visible) => !visible)}
              className="inline-flex items-center justify-center rounded-md p-1 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:bg-[var(--color-primary-bkg)] transition-colors"
              aria-pressed={showAmount}
              aria-label={showAmount ? 'Hide amount' : 'Show amount'}
              title={showAmount ? 'Hide amount' : 'Show amount'}
            >
              {showAmount ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            <strong>Due:</strong> {contract.dueDateMethod === 'endOfNextMonth' ? 'End of next month' : `${contract.dueDays ?? 30} days`}
          </p>
        </CardContent>
      </Card>

      {!freelancerReady && (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-[var(--text-main)] mb-3">{FREELANCER_INFO_REQUIRED_MESSAGE}</p>
            <Button type="button" variant="secondary" onClick={() => navigateToPage('settings')}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">Invoices</h2>

        <div className="border-b border-[var(--border-color)] mb-6">
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Invoice types">
            <button
              type="button"
              role="tab"
              aria-selected={invoiceTab === 'recurring'}
              onClick={() => setInvoiceTab('recurring')}
              className={tabButtonClass(invoiceTab === 'recurring')}
            >
              Recurring / Monthly
              <span className="ml-2 text-xs opacity-70">({recurringInvoices.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={invoiceTab === 'custom'}
              onClick={() => setInvoiceTab('custom')}
              className={tabButtonClass(invoiceTab === 'custom')}
            >
              Custom
              <span className="ml-2 text-xs opacity-70">({customInvoices.length})</span>
            </button>
          </div>
        </div>

        {invoiceTab === 'recurring' && (
          <div role="tabpanel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-sm text-[var(--text-muted)]">
                Monthly invoices generated from this contract.
              </p>
              <Button
                onClick={handleGenerateForYear}
                disabled={generating || !freelancerReady}
                data-coachmark="generate-invoices-btn"
              >
                {generating ? 'Generating…' : 'Generate for Year'}
              </Button>
            </div>
            {renderInvoiceTable(
              recurringInvoices,
              'No recurring invoices. Use Generate for Year to create monthly invoices.',
            )}
          </div>
        )}

        {invoiceTab === 'custom' && (
          <div role="tabpanel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-sm text-[var(--text-muted)]">
                Manually created invoices with custom line items.
              </p>
              <Button
                variant="secondary"
                onClick={handleCreateCustomInvoice}
                disabled={!freelancerReady}
                data-coachmark="create-invoice-btn"
              >
                + Create Custom Invoice
              </Button>
            </div>
            {renderInvoiceTable(
              customInvoices,
              'No custom invoices. Create one with custom line items.',
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={previewInvoice !== null}
        onClose={handleClosePreview}
        title={previewInvoice ? `Invoice Preview - ${previewInvoice.invoiceNumber}` : ''}
        className="max-w-5xl"
      >
        {previewUrl && (
          <div className="w-full h-[calc(90vh-120px)]">
            <iframe src={previewUrl} className="w-full h-full border border-[var(--border-color)] rounded-lg" title="Invoice Preview" />
          </div>
        )}
      </Modal>

      <GenerateYearOverlay
        isOpen={generatePhase !== 'idle'}
        phase={generatePhase === 'idle' ? 'generating' : generatePhase}
        year={generateYear}
        progress={generateProgress}
        result={generateResult}
        errorMessage={generateError}
        onClose={closeGenerateOverlay}
      />
    </div>
  );
}
