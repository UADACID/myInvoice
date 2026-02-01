import { useState, useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { contractService, invoiceService } from '@/storage/services';
import { generateInvoiceNumber } from '@/domain/types';
import { Button, Card, CardContent, Input, Select } from '@/components';
import type { InvoiceItem } from '@/domain/types';

export interface CreateInvoicePageProps {
  initialClientId?: string | null;
  initialContractId?: string | null;
}

export function CreateInvoicePage({ initialClientId, initialContractId }: CreateInvoicePageProps = {}) {
  const { clients, loading: clientsLoading } = useClients();
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'JPY',
  });
  const [linkedContractId, setLinkedContractId] = useState<string | null>(null);

  useEffect(() => {
    if (initialClientId) {
      setFormData((prev) => ({ ...prev, clientId: initialClientId }));
    }
    if (initialContractId) {
      setLinkedContractId(initialContractId);
      contractService.getById(initialContractId).then((contract) => {
        if (contract) {
          setFormData((prev) => ({ ...prev, currency: contract.currency, clientId: prev.clientId || contract.clientId }));
        }
      });
    } else {
      setLinkedContractId(null);
    }
  }, [initialClientId, initialContractId]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const calculateItemTotal = (item: InvoiceItem): number => {
    return item.quantity * item.unitPrice;
  };

  const calculateGrandTotal = (): number => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    // Clear errors when user makes changes
    if (errors[`item-${index}-${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`item-${index}-${field}`];
      setErrors(newErrors);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${index}-description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item-${index}-quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice <= 0) {
        newErrors[`item-${index}-unitPrice`] = 'Unit price must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const total = calculateGrandTotal();
      const issueDate = new Date(formData.issueDate);
      const invoiceNumber = generateInvoiceNumber(issueDate);

      await invoiceService.create({
        invoiceNumber,
        clientId: formData.clientId,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        total,
        createdAt: new Date().toISOString(),
        items: items.map(item => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        currency: formData.currency,
        invoiceType: 'custom',
        contractId: linkedContractId ?? null,
      });

      // Reset form
      setFormData({
        clientId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        currency: 'JPY',
      });
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      setErrors({});

      alert(`Invoice ${invoiceNumber} created successfully!`);

      // Navigate back: if we came from a contract, go to contract detail; else invoices
      if (initialContractId) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contract-detail', contractId: initialContractId } }));
      } else {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'invoices' } }));
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (clientsLoading) {
    return <div className="text-center py-16"><span className="text-sm text-[var(--text-muted)]">Loading...</span></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-2">Create Invoice</h1>
        <p className="text-[var(--text-muted)] text-sm">Create a custom invoice with multiple line items</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6">Invoice Details</h2>
            <div className="space-y-5 max-w-lg">
              <div>
                <Select
                  label="Client"
                  value={formData.clientId}
                  onChange={(e) => {
                    setFormData({ ...formData, clientId: e.target.value });
                    if (errors.clientId) {
                      const newErrors = { ...errors };
                      delete newErrors.clientId;
                      setErrors(newErrors);
                    }
                  }}
                  error={errors.clientId}
                  required
                  options={[
                    { label: 'Select a client', value: '' },
                    ...clients.map(client => ({
                      label: client.companyName,
                      value: client.id
                    }))
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Issue Date"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => {
                    setFormData({ ...formData, issueDate: e.target.value });
                    if (errors.issueDate) {
                      const newErrors = { ...errors };
                      delete newErrors.issueDate;
                      setErrors(newErrors);
                    }
                  }}
                  error={errors.issueDate}
                  required
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    setFormData({ ...formData, dueDate: e.target.value });
                    if (errors.dueDate) {
                      const newErrors = { ...errors };
                      delete newErrors.dueDate;
                      setErrors(newErrors);
                    }
                  }}
                  error={errors.dueDate}
                  required
                />
              </div>

              <div>
                <Select
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  options={[
                    { label: 'JPY', value: 'JPY' },
                    { label: 'USD', value: 'USD' },
                    { label: 'EUR', value: 'EUR' },
                    { label: 'GBP', value: 'GBP' },
                    { label: 'IDR', value: 'IDR' }
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Invoice Items</h2>
              <Button type="button" onClick={handleAddItem} variant="secondary">
                + Add Item
              </Button>
            </div>

            {errors.items && <p className="mb-4 text-sm text-red-600">{errors.items}</p>}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-muted)]">Description</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--text-muted)] w-24">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-muted)] w-32">Unit Price</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-muted)] w-32">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--text-muted)] w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const itemTotal = calculateItemTotal(item);
                    return (
                      <tr key={index} className="border-b border-[var(--border-color)]">
                        <td className="py-3 px-4">
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Item description"
                            error={errors[`item-${index}-description`]}
                            className="w-full"
                            required
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            error={errors[`item-${index}-quantity`]}
                            className="w-full text-center"
                            required
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            error={errors[`item-${index}-unitPrice`]}
                            className="w-full text-right"
                            required
                          />
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--text-main)] font-medium">
                          {itemTotal.toLocaleString()} {formData.currency}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border-color)]">
                    <td colSpan={3} className="py-4 px-4 text-right text-lg font-semibold text-[var(--text-main)]">
                      Grand Total:
                    </td>
                    <td className="py-4 px-4 text-right text-lg font-bold text-[var(--color-primary)]">
                      {calculateGrandTotal().toLocaleString()} {formData.currency}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'invoices' } }));
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
