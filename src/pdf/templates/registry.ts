import type { InvoiceTemplateId } from '@/domain/types';
import type { PdfRenderContext } from './types';
import { createUnifiedRenderer } from './unifiedTemplate';

export const DEFAULT_TEMPLATE: InvoiceTemplateId = 'default';

export const INVOICE_TEMPLATES: Record<
  InvoiceTemplateId,
  {
    id: InvoiceTemplateId;
    label: string;
    description: string;
    render: (ctx: PdfRenderContext) => Promise<void>;
  }
> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Neutral, monochrome — safe universal option',
    render: createUnifiedRenderer('default'),
  },
  clean: {
    id: 'clean',
    label: 'Clean',
    description: 'Modern, conservative with more white space',
    render: createUnifiedRenderer('clean'),
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    description: 'Business & accounting friendly, structured',
    render: createUnifiedRenderer('standard'),
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional, timeless with strong grid',
    render: createUnifiedRenderer('classic'),
  },
  soft_accent: {
    id: 'soft_accent',
    label: 'Soft Accent',
    description: 'Modern premium with subtle indigo accents',
    render: createUnifiedRenderer('soft_accent'),
  },
};

export function resolveTemplateId(value: string | undefined): InvoiceTemplateId {
  if (value && value in INVOICE_TEMPLATES) {
    return value as InvoiceTemplateId;
  }
  return DEFAULT_TEMPLATE;
}
