import { db } from './database';
import type { Client, Contract, Invoice, Settings, UUID } from '@/domain/types';
import { v4 as uuidv4 } from 'uuid';

// Client CRUD
export const clientService = {
  async getAll(): Promise<Client[]> {
    return await db.clients.toArray();
  },

  async getById(id: UUID): Promise<Client | undefined> {
    return await db.clients.get(id);
  },

  async create(data: Omit<Client, 'id'>): Promise<Client> {
    const client: Client = {
      id: uuidv4(),
      ...data,
    };
    await db.clients.add(client);
    return client;
  },

  async update(id: UUID, data: Partial<Omit<Client, 'id'>>): Promise<void> {
    await db.clients.update(id, data);
  },

  async delete(id: UUID): Promise<void> {
    await db.clients.delete(id);
  },
};

// Contract CRUD
export const contractService = {
  async getAll(): Promise<Contract[]> {
    return await db.contracts.toArray();
  },

  async getById(id: UUID): Promise<Contract | undefined> {
    return await db.contracts.get(id);
  },

  async getByClientId(clientId: UUID): Promise<Contract[]> {
    return await db.contracts.where('clientId').equals(clientId).toArray();
  },

  async create(data: Omit<Contract, 'id'>): Promise<Contract> {
    const contract: Contract = {
      id: uuidv4(),
      ...data,
    };
    await db.contracts.add(contract);
    return contract;
  },

  async update(id: UUID, data: Partial<Omit<Contract, 'id'>>): Promise<void> {
    await db.contracts.update(id, data);
  },

  async delete(id: UUID): Promise<void> {
    await db.contracts.delete(id);
  },
};

// Invoice CRUD
export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    return await db.invoices.orderBy('issueDate').reverse().toArray();
  },

  async getById(id: UUID): Promise<Invoice | undefined> {
    return await db.invoices.get(id);
  },

  async getByClientId(clientId: UUID): Promise<Invoice[]> {
    return await db.invoices.where('clientId').equals(clientId).toArray();
  },

  async create(data: Omit<Invoice, 'id'>): Promise<Invoice> {
    const invoice: Invoice = {
      id: uuidv4(),
      ...data,
    };
    await db.invoices.add(invoice);
    return invoice;
  },

  async update(id: UUID, data: Partial<Omit<Invoice, 'id'>>): Promise<void> {
    await db.invoices.update(id, data);
  },

  async delete(id: UUID): Promise<void> {
    await db.invoices.delete(id);
  },
};

// Settings (singleton)
export const settingsService = {
  async get(): Promise<Settings | null> {
    const settings = await db.settings.toCollection().first();
    return settings || null;
  },

  async set(data: Settings): Promise<void> {
    const existing = await db.settings.toCollection().first();
    if (existing && existing.id !== undefined) {
      await db.settings.update(existing.id, data);
    } else {
      await db.settings.add(data);
    }
  },

  async update(data: Partial<Settings>): Promise<void> {
    const existing = await db.settings.toCollection().first();
    if (existing && existing.id !== undefined) {
      await db.settings.update(existing.id, data);
    } else {
      // Create with defaults if doesn't exist
      const defaultSettings: Settings = {
        freelancerName: '',
        address: '',
        email: '',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        swift: '',
        bankCountry: '',
        bankCurrency: 'JPY',
        filenameTemplate: 'invoice-{yyyymm}.pdf',
        invoiceTemplate: 'modern_clean',
        ...data,
      };
      await db.settings.add(defaultSettings);
    }
  },
};
