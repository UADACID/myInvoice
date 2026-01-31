import type { Invoice, InvoiceType } from '@/domain/types';

/**
 * Resolve invoice type: use explicit invoiceType when present, else infer from items (custom = has items).
 */
export function getInvoiceType(inv: Invoice): InvoiceType {
  if (inv.invoiceType != null) {
    return inv.invoiceType;
  }
  return inv.items != null && inv.items.length > 0 ? 'custom' : 'recurring';
}
