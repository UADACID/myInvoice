import { useState } from 'react';
import { exportData, importData } from '@/services/backupService';
import { Button, Card, CardContent } from '@/components';

export function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      await importData(text);
      setMessage('Data imported successfully! Please refresh the page.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error importing data:', error);
      setMessage('Failed to import data. Please check the file format.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-8">Backup & Restore</h1>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3">Export Data</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Download all your data as a JSON file. This includes clients, contracts, invoices, and settings.
            </p>
            <Button onClick={handleExport} disabled={exporting} data-coachmark="export-btn">
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3">Import Data</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Restore your data from a previously exported JSON file. This will replace all existing data.
            </p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="block w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-primary)] file:text-white hover:file:opacity-90 file:cursor-pointer"
                data-coachmark="import-input"
              />
            </label>
            {importing && <p className="mt-3 text-sm text-[var(--text-muted)]">Importing...</p>}
          </CardContent>
        </Card>

        {message && (
          <Card className={message.includes('success') ? 'border-green-200' : 'border-red-200'}>
            <CardContent>
              <p className={`text-sm ${message.includes('success') ? 'text-green-800' : 'text-red-800'}`}>
                {message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
