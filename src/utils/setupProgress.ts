import type { Settings } from '@/domain/types';

export const FREELANCER_INFO_REQUIRED_MESSAGE =
  'Please fill in Freelancer Information (name, address, and email) in Settings before creating invoices.';

const isFilled = (value: string | undefined): boolean => (value ?? '').trim().length > 0;

export type SetupSectionId = 'freelancer' | 'bank' | 'pdf';

export interface SetupField {
  key: keyof Settings;
  label: string;
}

export interface SetupSectionProgress {
  id: SetupSectionId;
  label: string;
  description: string;
  required: boolean;
  fields: SetupField[];
  filledCount: number;
  totalCount: number;
  percent: number;
  complete: boolean;
  missingLabels: string[];
}

export interface SetupProgress {
  sections: SetupSectionProgress[];
  overallPercent: number;
  requiredComplete: boolean;
  fullyComplete: boolean;
  completedSteps: number;
  totalSteps: number;
}

const SETUP_SECTIONS: Array<{
  id: SetupSectionId;
  label: string;
  description: string;
  required: boolean;
  fields: SetupField[];
}> = [
  {
    id: 'freelancer',
    label: 'Freelancer Information',
    description: 'Required before creating invoices',
    required: true,
    fields: [
      { key: 'freelancerName', label: 'Name' },
      { key: 'address', label: 'Address' },
      { key: 'email', label: 'Email' },
    ],
  },
  {
    id: 'bank',
    label: 'Bank Details',
    description: 'Shown on invoice PDFs for payment',
    required: false,
    fields: [
      { key: 'bankName', label: 'Bank Name' },
      { key: 'accountHolder', label: 'Account Holder' },
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'swift', label: 'SWIFT Code' },
      { key: 'bankCountry', label: 'Bank Country' },
    ],
  },
  {
    id: 'pdf',
    label: 'PDF Preferences',
    description: 'Filename template and invoice style',
    required: false,
    fields: [
      { key: 'filenameTemplate', label: 'Filename Template' },
    ],
  },
];

function getFieldValue(settings: Partial<Settings>, key: keyof Settings): string {
  const value = settings[key];
  if (typeof value === 'string') return value;
  if (key === 'invoiceTemplate' && value) return String(value);
  return '';
}

function isFieldComplete(settings: Partial<Settings>, field: SetupField): boolean {
  if (field.key === 'invoiceTemplate') {
    return Boolean(settings.invoiceTemplate);
  }
  return isFilled(getFieldValue(settings, field.key));
}

export function getSetupProgress(settings: Partial<Settings> | null | undefined): SetupProgress {
  const data = settings ?? {};

  const sections: SetupSectionProgress[] = SETUP_SECTIONS.map((section) => {
    const fields = [...section.fields];
    if (section.id === 'pdf') {
      fields.push({ key: 'invoiceTemplate', label: 'Invoice Template' });
    }

    const missingLabels = fields
      .filter((field) => !isFieldComplete(data, field))
      .map((field) => field.label);

    const filledCount = fields.length - missingLabels.length;
    const totalCount = fields.length;
    const percent = totalCount === 0 ? 100 : Math.round((filledCount / totalCount) * 100);

    return {
      id: section.id,
      label: section.label,
      description: section.description,
      required: section.required,
      fields,
      filledCount,
      totalCount,
      percent,
      complete: filledCount === totalCount,
      missingLabels,
    };
  });

  const overallPercent = Math.round(
    sections.reduce((sum, section) => sum + section.percent, 0) / sections.length
  );
  const requiredComplete = sections.filter((section) => section.required).every((section) => section.complete);
  const fullyComplete = sections.every((section) => section.complete);
  const completedSteps = sections.filter((section) => section.complete).length;

  return {
    sections,
    overallPercent,
    requiredComplete,
    fullyComplete,
    completedSteps,
    totalSteps: sections.length,
  };
}

/**
 * Freelancer Information must be complete before creating or generating invoices.
 */
export function isFreelancerInfoComplete(settings: Settings | null | undefined): boolean {
  return getSetupProgress(settings).requiredComplete;
}
