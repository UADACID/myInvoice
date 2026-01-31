import { settingsService } from '@/storage/services';
import type { Settings } from '@/domain/types';

/**
 * Initialize default settings if none exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  const existing = await settingsService.get();
  if (!existing) {
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
    };
    await settingsService.set(defaultSettings);
  }
}
