import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { Client, Invoice, InvoiceTemplateId, Settings } from '@/domain/types';
import { formatFilename } from './filenameFormatter';
import { contractService } from '@/storage/services';
import { INVOICE_TEMPLATES, resolveTemplateId } from './templates/registry';
import type { PdfRenderContext } from './templates/types';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;

/**
 * Build the render context with pre-computed data for template renderers
 */
async function buildContext(
  doc: PDFDocument,
  page: ReturnType<PDFDocument['addPage']>,
  invoice: Invoice,
  client: Client,
  settings: Settings
): Promise<PdfRenderContext> {
  const contract = invoice.contractId != null
    ? (await contractService.getById(invoice.contractId)) ?? null
    : (await contractService.getByClientId(invoice.clientId))[0] ?? null;
  const hasCustomItems = invoice.invoiceType != null
    ? invoice.invoiceType === 'custom'
    : !!(invoice.items && invoice.items.length > 0);
  const currency = invoice.currency || contract?.currency || 'JPY';
  const itemsToRender = hasCustomItems && invoice.items ? invoice.items : [];

  let paymentTerms: string;
  if (contract) {
    const dueDateMethod = contract.dueDateMethod || 'days';
    if (dueDateMethod === 'endOfNextMonth') {
      paymentTerms = 'Payment is due by the end of the invoice month.';
    } else {
      const dueDays = contract.dueDays || 30;
      paymentTerms = `Payment is due within ${dueDays} days from the invoice date.`;
    }
  } else {
    paymentTerms = 'Payment is due within 30 days from the invoice date.';
  }

  const invoiceDate = new Date(invoice.issueDate);
  const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
  const year = invoiceDate.getFullYear();
  const parts = invoice.invoiceNumber.split('-');
  const timestamp = parts.at(-1) || '';
  const ms = timestamp.slice(-4);
  const invoiceNumText = `INVOICE [${month}-${year}-${ms}]`;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  return {
    doc,
    page,
    invoice,
    client,
    settings,
    fonts: { regular: font, bold: boldFont },
    dimensions: { width: A4_WIDTH, height: A4_HEIGHT, margin: MARGIN },
    contract,
    currency,
    itemsToRender,
    hasCustomItems,
    paymentTerms,
    invoiceNumText,
  };
}

/**
 * Generate PDF for an invoice using the template selected in settings.
 * @param templateIdOverride - When provided, use this template instead of settings.invoiceTemplate (for previews)
 */
export async function generateInvoicePdf(
  invoice: Invoice,
  client: Client,
  settings: Settings,
  templateIdOverride?: InvoiceTemplateId
): Promise<{ pdfBytes: Uint8Array; filename: string }> {
  const templateId = templateIdOverride ?? resolveTemplateId(settings.invoiceTemplate);
  const template = INVOICE_TEMPLATES[templateId];

  const doc = await PDFDocument.create();
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);

  const ctx = await buildContext(doc, page, invoice, client, settings);
  await template.render(ctx);

  const pdfBytes = await doc.save();
  const filename = formatFilename(settings.filenameTemplate, invoice, client, settings);

  return { pdfBytes, filename };
}
