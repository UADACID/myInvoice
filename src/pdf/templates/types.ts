import type { PDFDocument, PDFPage, PDFFont } from 'pdf-lib';
import type { Client, Contract, Invoice, InvoiceItem, Settings } from '@/domain/types';

export interface PdfRenderContext {
  doc: PDFDocument;
  page: PDFPage;
  invoice: Invoice;
  client: Client;
  settings: Settings;
  fonts: { regular: PDFFont; bold: PDFFont };
  dimensions: {
    width: number;
    height: number;
    margin: number;
  };
  /** Pre-computed: contract for this invoice's client */
  contract: Contract | null;
  /** Resolved currency (invoice > contract > JPY) */
  currency: string;
  /** Items to render (custom items or empty for contract-based) */
  itemsToRender: InvoiceItem[];
  /** Whether invoice has custom line items */
  hasCustomItems: boolean;
  /** Pre-computed payment terms text */
  paymentTerms: string;
  /** Pre-computed invoice number display text [MM-YYYY-ms] */
  invoiceNumText: string;
}
