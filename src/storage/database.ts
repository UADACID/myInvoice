import Dexie, { type Table } from 'dexie';
import type { Client, Contract, Invoice, Settings, UUID } from '@/domain/types';

// Settings with database id
type SettingsRecord = Settings & { id?: number };

// Define database schema
class InvoiceDatabase extends Dexie {
  clients!: Table<Client, UUID>;
  contracts!: Table<Contract, UUID>;
  invoices!: Table<Invoice, UUID>;
  settings!: Table<SettingsRecord, number>; // Settings is a singleton, use number as key

  constructor() {
    super('InvoiceDB');

    this.version(1).stores({
      clients: 'id, companyName',
      contracts: 'id, clientId',
      invoices: 'id, invoiceNumber, clientId, issueDate',
      settings: '++id', // Auto-increment for singleton
    });

    this.version(2).stores({
      clients: 'id, companyName',
      contracts: 'id, clientId',
      invoices: 'id, invoiceNumber, clientId, issueDate, contractId',
      settings: '++id',
    });
  }
}

export const db = new InvoiceDatabase();
