import type { Client, Invoice, Settings } from '@/domain/types';

/** Sample data for invoice template previews (no DB dependency) */
export const SAMPLE_CLIENT: Client = {
  id: 'sample-client-id',
  companyName: 'Acme Corporation',
  address: '123 Business Ave\nSuite 100\nTokyo, Japan',
  email: 'billing@acme.example.com',
};

export const SAMPLE_INVOICE: Invoice = {
  id: 'sample-invoice-id',
  invoiceNumber: 'INV-2025-01-1706700000',
  clientId: SAMPLE_CLIENT.id,
  issueDate: '2025-01-15',
  dueDate: '2025-02-15',
  total: 150000,
  createdAt: '2025-01-15T00:00:00.000Z',
  currency: 'JPY',
  items: [
    { description: 'Consulting Services - January 2025', quantity: 1, unitPrice: 100000 },
    { description: 'Additional Support', quantity: 10, unitPrice: 5000 },
  ],
};

export const SAMPLE_SETTINGS: Settings = {
  freelancerName: 'Jane Smith',
  address: '456 Freelancer St\nOsaka, Japan',
  email: 'jane@freelancer.example.com',
  bankName: 'Sample Bank',
  accountHolder: 'Jane Smith',
  accountNumber: '****1234',
  swift: 'SAMPLEXX',
  bankCountry: 'Japan',
  bankCurrency: 'JPY',
  filenameTemplate: 'invoice-{yyyymm}.pdf',
};
