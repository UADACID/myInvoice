import { useState, useEffect, useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { settingsService } from '@/storage/services';
import { Input, Textarea, Button, Card, CardContent, Select } from '@/components';
import type { Settings } from '@/domain/types';
import { INVOICE_TEMPLATES, DEFAULT_TEMPLATE } from '@/pdf/templates/registry';
import { InvoiceTemplateCard } from './InvoiceTemplateCard';
import { SetupProgress } from '@/components/SetupProgress';
import { getSetupProgress, isFreelancerInfoComplete, type SetupSectionId } from '@/utils/setupProgress';
import { formatFilename } from '@/pdf/filenameFormatter';
import { SAMPLE_CLIENT, SAMPLE_INVOICE } from '@/pdf/templates/sampleData';
import { CURRENCY_OPTIONS } from '@/utils/currencies';

export function SettingsPage() {
  const { settings, loading } = useSettings();
  const [formData, setFormData] = useState<Partial<Settings>>({
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
    invoiceTemplate: DEFAULT_TEMPLATE,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const setupProgress = useMemo(() => getSetupProgress(formData), [formData]);

  const filenamePreview = useMemo(() => {
    const previewSettings = {
      ...formData,
      freelancerName: formData.freelancerName || 'Your Name',
      filenameTemplate: formData.filenameTemplate || 'invoice-{yyyymm}.pdf',
    } as Settings;
    return formatFilename(
      previewSettings.filenameTemplate,
      SAMPLE_INVOICE,
      SAMPLE_CLIENT,
      previewSettings
    );
  }, [formData.filenameTemplate, formData.freelancerName]);

  const scrollToSetupSection = (sectionId: SetupSectionId) => {
    document.getElementById(`setup-section-${sectionId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      if (settings) {
        await settingsService.update(formData);
      } else {
        await settingsService.set(formData as Settings);
      }
      setSaved(true);
      if (isFreelancerInfoComplete(formData as Settings)) {
        localStorage.setItem('setup_redirect_done', 'true');
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-[var(--text-muted)]">Loading</span></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-8" data-coachmark="settings-nav">Settings</h1>
      <SetupProgress progress={setupProgress} onSectionClick={scrollToSetupSection} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card id="setup-section-freelancer" className="scroll-mt-24" data-coachmark="freelancer-info-card">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6">Freelancer Information</h2>
            <div className="space-y-5">
              <Input
                label="Name"
                value={formData.freelancerName || ''}
                onChange={(e) => setFormData({ ...formData, freelancerName: e.target.value })}
                required
              />
              <Textarea
                label="Address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card id="setup-section-bank" className="scroll-mt-24" data-coachmark="bank-details-card">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6">Bank Details</h2>
            <div className="space-y-5">
              <Input
                label="Bank Name"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
              <Input
                label="Account Holder"
                value={formData.accountHolder || ''}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              />
              <Input
                label="Account Number"
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
              <Input
                label="SWIFT Code"
                value={formData.swift || ''}
                onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
              />
              <Input
                label="Bank Country"
                value={formData.bankCountry || ''}
                onChange={(e) => setFormData({ ...formData, bankCountry: e.target.value })}
              />
              <Select
                label="Bank Currency"
                value={formData.bankCurrency || 'JPY'}
                onChange={(e) => setFormData({ ...formData, bankCurrency: e.target.value })}
                options={CURRENCY_OPTIONS}
              />
            </div>
          </CardContent>
        </Card>

        <div id="setup-section-pdf" className="space-y-6 scroll-mt-24">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6">PDF Filename Template</h2>
            <Input
              label="Template"
              value={formData.filenameTemplate || ''}
              onChange={(e) => setFormData({ ...formData, filenameTemplate: e.target.value })}
              placeholder="invoice-{yyyymm}.pdf"
              data-coachmark="filename-template-input"
            />
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Tokens: {'{freelancer}'}, {'{client}'}, {'{month}'}, {'{monthPad}'}, {'{year}'}, {'{yyyymm}'}
            </p>

            <div className="mt-6 pt-5 border-t border-dashed border-[var(--border-color)]">
              <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Download will save as</p>
              <div className="inline-flex max-w-full items-center gap-2.5 rounded-full bg-[var(--color-primary-bkg)] px-4 py-2.5">
                <svg
                  className="h-4 w-4 shrink-0 text-[var(--color-primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-mono text-sm font-semibold text-[var(--color-primary)] break-all">
                  {filenamePreview}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                Sample: client <span className="font-medium text-[var(--text-main)]">{SAMPLE_CLIENT.companyName}</span>
                {' · '}date <span className="font-medium text-[var(--text-main)]">{SAMPLE_INVOICE.issueDate}</span>
                {' · '}freelancer{' '}
                <span className="font-medium text-[var(--text-main)]">
                  {formData.freelancerName?.trim() || 'Your Name'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-2">Invoice Template</h2>
            <p className="mb-6 text-sm text-[var(--text-muted)]">
              Choose the visual style for generated invoice PDFs
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(INVOICE_TEMPLATES).map((template) => (
                <InvoiceTemplateCard
                  key={template.id}
                  templateId={template.id}
                  label={template.label}
                  isSelected={(formData.invoiceTemplate ?? DEFAULT_TEMPLATE) === template.id}
                  onSelect={() =>
                    setFormData({ ...formData, invoiceTemplate: template.id })
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={saving} data-coachmark="save-settings-btn">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && <span className="text-sm text-green-600">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}
