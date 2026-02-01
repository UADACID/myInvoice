import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { settingsService } from '@/storage/services';
import { Input, Textarea, Button, Card, CardContent } from '@/components';
import type { Settings } from '@/domain/types';
import { INVOICE_TEMPLATES, DEFAULT_TEMPLATE } from '@/pdf/templates/registry';
import { InvoiceTemplateCard } from './InvoiceTemplateCard';

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
      <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-8">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card data-coachmark="freelancer-info-card">
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
              />
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card data-coachmark="bank-details-card">
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
              <Input
                label="Bank Currency"
                value={formData.bankCurrency || ''}
                onChange={(e) => setFormData({ ...formData, bankCurrency: e.target.value })}
                placeholder="JPY"
              />
            </div>
          </CardContent>
        </Card>

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
