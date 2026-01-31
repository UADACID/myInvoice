import { useState, useEffect } from 'react';
import { generateInvoicePdf } from '@/pdf/invoicePdf';
import {
  SAMPLE_INVOICE,
  SAMPLE_CLIENT,
  SAMPLE_SETTINGS,
} from '@/pdf/templates/sampleData';
import type { InvoiceTemplateId } from '@/domain/types';

interface InvoiceTemplateCardProps {
  readonly templateId: InvoiceTemplateId;
  readonly label: string;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

export function InvoiceTemplateCard({
  templateId,
  label,
  isSelected,
  onSelect,
}: InvoiceTemplateCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let blobUrl: string | null = null;

    async function generatePreview() {
      try {
        const { pdfBytes } = await generateInvoicePdf(
          SAMPLE_INVOICE,
          SAMPLE_CLIENT,
          SAMPLE_SETTINGS,
          templateId
        );
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);
      } catch (err) {
        console.error('Failed to generate template preview:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    generatePreview();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [templateId]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col overflow-hidden rounded-xl border-2 transition-all text-left hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/50 shadow-md'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="relative aspect-[595/842] w-full overflow-hidden rounded-t-lg bg-slate-100">
        {loading && (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm text-slate-400">Loading...</span>
          </div>
        )}
        {error && (
          <div className="flex h-full w-full items-center justify-center p-4">
            <span className="text-sm text-red-500">Preview unavailable</span>
          </div>
        )}
        {previewUrl && !loading && !error && (
          <iframe
            src={previewUrl}
            title={`Preview: ${label}`}
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-medium text-slate-900">{label}</span>
        {isSelected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>
    </button>
  );
}
