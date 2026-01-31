export type UUID = string;

export interface Client {
  id: UUID;
  companyName: string;
  address: string;
  email: string;
}

export type DueDateMethod = 'days' | 'endOfNextMonth';

export interface Contract {
  id: UUID;
  clientId: UUID;
  descriptionTemplate: string;
  unitPrice: number;
  currency: string; // default: JPY
  quantity: number; // default: 1
  dueDays: number; // default: 30 (used when dueDateMethod is 'days')
  dueDateMethod: DueDateMethod; // default: 'days'
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export type InvoiceType = 'recurring' | 'custom';

export interface Invoice {
  id: UUID;
  invoiceNumber: string;
  clientId: UUID;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  total: number;
  createdAt: string; // ISO date string
  // Custom invoice fields (optional for backward compatibility)
  items?: InvoiceItem[]; // Custom invoice items
  currency?: string; // Currency for custom invoice (defaults to contract currency or JPY)
  // Contract-centric fields (optional for backward compatibility)
  invoiceType?: InvoiceType; // Explicit type; legacy inferred from items
  contractId?: string | null; // Recurring MUST have; custom MAY have
}

export type InvoiceTemplateId = 'modern_clean' | 'colorful_minimal' | 'professional';

export interface Settings {
  freelancerName: string;
  address: string;
  email: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  swift: string;
  bankCountry: string;
  bankCurrency: string; // default: JPY
  filenameTemplate: string; // default: invoice-{yyyymm}.pdf
  invoiceTemplate?: InvoiceTemplateId; // default: modern_clean
}

/**
 * Generate a unique invoice number in format: INV-YYYY-MM-{timestamp}
 */
export function generateInvoiceNumber(issueDate: Date): string {
  const year = issueDate.getFullYear();
  const month = String(issueDate.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  return `INV-${year}-${month}-${timestamp}`;
}
