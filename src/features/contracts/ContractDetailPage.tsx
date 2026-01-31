import { useState, useMemo } from 'react';
import { useContract } from '@/hooks/useContract';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useSettings } from '@/hooks/useSettings';
import { invoiceService } from '@/storage/services';
import { generateInvoicesForYear } from '@/services/invoiceService';
import { generateInvoicePdf } from '@/pdf/invoicePdf';
import { Button, Card, CardContent, Table, TableRow, TableCell, Modal } from '@/components';
import type { Invoice } from '@/domain/types';

export interface ContractDetailPageProps {
  contractId: string | null;
  onNavigate: (page: string, clientId?: string, contractId?: string) => void;
}

export function ContractDetailPage({ contractId, onNavigate }: ContractDetailPageProps) {
  const { contract, loading } = useContract(contractId);
  const { invoices, refreshInvoices } = useInvoices();
  const { clients } = useClients();
  const { settings } = useSettings();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const contractInvoices = useMemo(
    () => (contractId ? invoices.filter((inv) => inv.contractId === contractId) : []),
    [invoices, contractId]
  );

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.companyName ?? 'Unknown';

  const handleGenerateForYear = async () => {
    if (!contractId) return;
    const year = new Date().getFullYear();
    if (!confirm(`Generate recurring invoices for ${year}? Existing invoices for this contract will be updated if data changed.`)) return;
    setGenerating(true);
    try {
      const result = await generateInvoicesForYear(contractId, year);
      const parts: string[] = [];
      if (result.created.length > 0) parts.push(`Created ${result.created.length} new`);
      if (result.updated > 0) parts.push(`Updated ${result.updated}`);
      if (result.skipped > 0) parts.push(`Skipped ${result.skipped} unchanged`);
      alert(parts.length > 0 ? parts.join(', ') + '.' : 'No invoices generated.');
      refreshInvoices();
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
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
    onNavigate('create-invoice', contract.clientId, contractId ?? undefined);
  };

  if (!contractId) {
    return (
      <div>
        <Button type="button" variant="secondary" onClick={() => onNavigate('contracts')} className="mb-4">
          Back to Contracts
        </Button>
        <p className="text-slate-600">No contract selected. Go back to Contracts and click View on a contract.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-slate-400">Loading</span></div>;
  }

  if (!contract) {
    return (
      <div>
        <Button type="button" variant="secondary" onClick={() => onNavigate('contracts')} className="mb-4">
          Back to Contracts
        </Button>
        <p className="text-slate-600">Contract not found.</p>
      </div>
    );
  }

  const clientName = getClientName(contract.clientId);

  return (
    <div>
      <Button type="button" variant="secondary" onClick={() => onNavigate('contracts')} className="mb-6">
        Back to Contracts
      </Button>

      <Card className="mb-8">
        <CardContent>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Contract</h1>
          <p className="text-slate-600 text-sm mb-1"><strong>Client:</strong> {clientName}</p>
          <p className="text-slate-600 text-sm mb-1"><strong>Description:</strong> {contract.descriptionTemplate}</p>
          <p className="text-slate-600 text-sm mb-1">
            <strong>Amount:</strong> {contract.unitPrice.toLocaleString()} {contract.currency} × {contract.quantity}
          </p>
          <p className="text-slate-600 text-sm">
            <strong>Due:</strong> {contract.dueDateMethod === 'endOfNextMonth' ? 'End of next month' : `${contract.dueDays ?? 30} days`}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateForYear}
            disabled={generating}
            data-coachmark="generate-invoices-btn"
          >
            {generating ? 'Generating…' : 'Generate for Year'}
          </Button>
          <Button variant="secondary" onClick={handleCreateCustomInvoice} data-coachmark="create-invoice-btn">
            + Create Custom Invoice
          </Button>
        </div>
      </div>

      {contractInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-slate-500 text-sm">
              No invoices for this contract. Generate recurring invoices or create a custom invoice.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Table headers={['Invoice Number', 'Issue Date', 'Due Date', 'Total', 'Actions']}>
          {contractInvoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.invoiceNumber}</TableCell>
              <TableCell>{inv.issueDate}</TableCell>
              <TableCell>{inv.dueDate}</TableCell>
              <TableCell className="font-medium">{inv.total.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePreview(inv.id)}
                    disabled={previewLoading || !settings}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-40"
                  >
                    {previewLoading ? 'Loading…' : 'Preview'}
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(inv.id)}
                    disabled={downloading === inv.id || !settings}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-40"
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
      )}

      <Modal
        isOpen={previewInvoice !== null}
        onClose={handleClosePreview}
        title={previewInvoice ? `Invoice Preview - ${previewInvoice.invoiceNumber}` : ''}
        className="max-w-5xl"
      >
        {previewUrl && (
          <div className="w-full h-[calc(90vh-120px)]">
            <iframe src={previewUrl} className="w-full h-full border border-slate-200 rounded-lg" title="Invoice Preview" />
          </div>
        )}
      </Modal>
    </div>
  );
}
