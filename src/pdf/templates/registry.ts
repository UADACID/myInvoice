import type { InvoiceTemplateId } from '@/domain/types';
import type { PdfRenderContext } from './types';
import { renderModernClean } from './modernClean';
import { renderColorfulMinimal } from './colorfulMinimal';
import { renderProfessional } from './professional';

export const DEFAULT_TEMPLATE: InvoiceTemplateId = 'modern_clean';

export const INVOICE_TEMPLATES: Record<
  InvoiceTemplateId,
  {
    id: InvoiceTemplateId;
    label: string;
    render: (ctx: PdfRenderContext) => Promise<void>;
  }
> = {
  modern_clean: {
    id: 'modern_clean',
    label: 'Modern Clean',
    render: renderModernClean,
  },
  colorful_minimal: {
    id: 'colorful_minimal',
    label: 'Colorful Minimal',
    render: renderColorfulMinimal,
  },
  professional: {
    id: 'professional',
    label: 'Professional',
    render: renderProfessional,
  },
};

export function resolveTemplateId(value: string | undefined): InvoiceTemplateId {
  if (value && value in INVOICE_TEMPLATES) {
    return value as InvoiceTemplateId;
  }
  return DEFAULT_TEMPLATE;
}
