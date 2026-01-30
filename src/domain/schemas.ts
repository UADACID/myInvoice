// Validation schemas if needed in the future
// Currently using TypeScript types for validation

import type { Settings } from './types';

export const defaultSettings: Partial<Settings> = {
  filenameTemplate: 'invoice-{yyyymm}.pdf',
};
