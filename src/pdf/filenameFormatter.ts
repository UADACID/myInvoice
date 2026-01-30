import type { Client, Invoice, Settings } from '@/domain/types';

/**
 * Sanitize filename by replacing forbidden characters
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, '-');
}

/**
 * Format filename from template
 */
export function formatFilename(
  template: string,
  invoice: Invoice,
  client: Client,
  settings: Settings
): string {
  // Fallback if template is empty or invalid
  if (!template || template.trim() === '') {
    const date = new Date(invoice.issueDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return sanitizeFilename(`invoice-${year}${month}.pdf`);
  }

  const date = new Date(invoice.issueDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthPad = String(month).padStart(2, '0');
  const yyyymm = `${year}${monthPad}`;

  let filename = template
    .replace(/\{freelancer\}/g, settings.freelancerName || '')
    .replace(/\{client\}/g, client.companyName || '')
    .replace(/\{month\}/g, String(month))
    .replace(/\{monthPad\}/g, monthPad)
    .replace(/\{year\}/g, String(year))
    .replace(/\{yyyymm\}/g, yyyymm);

  // Ensure .pdf extension
  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }

  return sanitizeFilename(filename);
}
