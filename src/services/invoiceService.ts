import { contractService, invoiceService } from '@/storage/services';
import { generateInvoiceNumber } from '@/domain/types';
import type { Invoice } from '@/domain/types';

/**
 * Generate invoices for all contracts for a given year
 * Updates existing invoices if contract data has changed, creates new ones if they don't exist
 */
export async function generateInvoicesForYear(year: number): Promise<{ created: Invoice[]; updated: number; skipped: number }> {
  const contracts = await contractService.getAll();
  
  if (contracts.length === 0) {
    throw new Error('No contracts found. Please create a contract first.');
  }

  const invoices: Invoice[] = [];
  let updated = 0;
  let skipped = 0;

  for (const contract of contracts) {
    for (let month = 0; month < 12; month++) {
      // Invoice date is the last day of the previous month
      // For January 2026 invoice: issueDate = 2025-12-31 (last day of December 2025)
      const issueDate = new Date(year, month, 0); // Day 0 gives last day of previous month
      
      // Format dates in local timezone to avoid UTC conversion issues
      const formatDateLocal = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const issueDateStr = formatDateLocal(issueDate);
      
      let dueDate: Date;
      
      // Handle backward compatibility: if dueDateMethod is not set, default to 'days'
      const dueDateMethod = contract.dueDateMethod || 'days';
      
      if (dueDateMethod === 'endOfNextMonth') {
        // Due date is the last day of the invoice month
        // For January 2026 invoice: dueDate = 2026-01-31 (last day of January 2026)
        dueDate = new Date(year, month + 1, 0); // Day 0 of month+1 gives last day of month
      } else {
        // Use fixed number of days from invoice date
        dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + (contract.dueDays || 30));
      }

      const dueDateStr = formatDateLocal(dueDate);
      const total = contract.unitPrice * contract.quantity;

      // Check if invoice already exists
      const existingInvoices = await invoiceService.getByClientId(contract.clientId);
      const existingInvoice = existingInvoices.find((inv) => inv.issueDate === issueDateStr);

      if (existingInvoice) {
        // Update existing invoice with current contract data if values changed
        const needsUpdate = 
          existingInvoice.total !== total || 
          existingInvoice.dueDate !== dueDateStr;
        
        if (needsUpdate) {
          await invoiceService.update(existingInvoice.id, {
            dueDate: dueDateStr,
            total,
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new invoice
        const invoice: Omit<Invoice, 'id'> = {
          invoiceNumber: generateInvoiceNumber(issueDate),
          clientId: contract.clientId,
          issueDate: issueDateStr,
          dueDate: dueDateStr,
          total,
          createdAt: new Date().toISOString(),
        };

        const created = await invoiceService.create(invoice);
        invoices.push(created);
      }
    }
  }

  return { created: invoices, updated, skipped };
}
