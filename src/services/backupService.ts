import { db } from '@/storage/database';
import { clientService, contractService, invoiceService, settingsService } from '@/storage/services';
import type { Client, Contract, Invoice, Settings } from '@/domain/types';

export interface BackupData {
  clients: Client[];
  contracts: Contract[];
  invoices: Invoice[];
  settings: Settings | null;
}

/**
 * Export all data to JSON
 */
export async function exportData(): Promise<string> {
  const [clients, contracts, invoices, settings] = await Promise.all([
    clientService.getAll(),
    contractService.getAll(),
    invoiceService.getAll(),
    settingsService.get(),
  ]);

  const data: BackupData = {
    clients,
    contracts,
    invoices,
    settings,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON and restore database
 */
export async function importData(jsonData: string): Promise<void> {
  let data: BackupData;
  
  try {
    data = JSON.parse(jsonData);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  // Validate structure
  if (!Array.isArray(data.clients) || !Array.isArray(data.contracts) || !Array.isArray(data.invoices)) {
    throw new Error('Invalid backup data structure');
  }

  // Clear existing data
  await db.transaction('rw', db.clients, db.contracts, db.invoices, db.settings, async () => {
    await db.clients.clear();
    await db.contracts.clear();
    await db.invoices.clear();
    await db.settings.clear();

    // Restore data
    if (data.clients.length > 0) {
      await db.clients.bulkAdd(data.clients);
    }
    if (data.contracts.length > 0) {
      await db.contracts.bulkAdd(data.contracts);
    }
    if (data.invoices.length > 0) {
      await db.invoices.bulkAdd(data.invoices);
    }
    if (data.settings) {
      await db.settings.add(data.settings);
    }
  });
}
