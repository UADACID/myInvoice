import { contractService, invoiceService, settingsService } from '@/storage/services';
import { generateInvoiceNumber } from '@/domain/types';
import type { Invoice } from '@/domain/types';
import { FREELANCER_INFO_REQUIRED_MESSAGE, isFreelancerInfoComplete } from '@/utils/freelancerInfo';

const formatDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface GenerateInvoicesResult {
  created: Invoice[];
  updated: number;
  skipped: number;
}

const GENERATE_PROGRESS_STEP_MS = 220;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type GenerateInvoicesProgressCallback = (
  current: number,
  total: number,
  monthLabel: string,
) => void;

/**
 * Generate recurring invoices for a single contract for a given year.
 * Matches by contractId + issueDate. Creates or updates 12 monthly invoices.
 */
export async function generateInvoicesForYear(
  contractId: string,
  year: number,
  onProgress?: GenerateInvoicesProgressCallback,
): Promise<GenerateInvoicesResult> {
  const settings = await settingsService.get();
  if (!isFreelancerInfoComplete(settings)) {
    throw new Error(FREELANCER_INFO_REQUIRED_MESSAGE);
  }

  const contract = await contractService.getById(contractId);
  if (!contract) {
    throw new Error('Contract not found.');
  }

  const invoices: Invoice[] = [];
  let updated = 0;
  let skipped = 0;
  const existingInvoices = await invoiceService.getByContractId(contractId);

  for (let month = 0; month < 12; month++) {
    const issueDate = new Date(year, month, 0);
    const issueDateStr = formatDateLocal(issueDate);
    const monthLabel = issueDate.toLocaleString('default', { month: 'long' });

    if (onProgress) {
      onProgress(month + 1, 12, monthLabel);
      await sleep(GENERATE_PROGRESS_STEP_MS);
    }

    const dueDateMethod = contract.dueDateMethod || 'days';
    let dueDate: Date;
    if (dueDateMethod === 'endOfNextMonth') {
      dueDate = new Date(year, month + 1, 0);
    } else {
      dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + (contract.dueDays || 30));
    }
    const dueDateStr = formatDateLocal(dueDate);
    const total = contract.unitPrice * contract.quantity;

    const existingInvoice = existingInvoices.find((inv) => inv.issueDate === issueDateStr);

    if (existingInvoice) {
      const needsUpdate =
        existingInvoice.total !== total ||
        existingInvoice.dueDate !== dueDateStr;

      if (needsUpdate) {
        await invoiceService.update(existingInvoice.id, {
          dueDate: dueDateStr,
          total,
          invoiceType: 'recurring',
          contractId: contract.id,
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      const invoice: Omit<Invoice, 'id'> = {
        invoiceNumber: generateInvoiceNumber(issueDate),
        clientId: contract.clientId,
        issueDate: issueDateStr,
        dueDate: dueDateStr,
        total,
        createdAt: new Date().toISOString(),
        invoiceType: 'recurring',
        contractId: contract.id,
      };
      const created = await invoiceService.create(invoice);
      invoices.push(created);
    }
  }

  return { created: invoices, updated, skipped };
}
