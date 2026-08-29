import { useState, useEffect, useMemo } from 'react';
import { useClient } from '@/hooks/useClient';
import { contractService } from '@/storage/services';
import { Button, Card, CardContent, Input, NumericInput, Table, TableRow, TableCell, Select } from '@/components';
import type { Contract } from '@/domain/types';

import { useAppNavigation } from '@/navigation/useAppNavigation';
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '@/utils/currencies';
import { getDueDateMethodHint, getQuantityHint, normalizeQuantity, previewDescriptionTemplate } from '@/utils/descriptionTemplate';

export interface ClientDetailPageProps {
  clientId: string | null;
}

const defaultContractForm: Omit<Contract, 'id'> = {
  clientId: '',
  descriptionTemplate: '',
  unitPrice: 0,
  currency: DEFAULT_CURRENCY,
  quantity: 0,
  dueDays: 30,
  dueDateMethod: 'days',
};

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const { navigateToPage } = useAppNavigation();
  const { client, loading } = useClient(clientId);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Contract, 'id'>>(defaultContractForm);
  const [showForm, setShowForm] = useState(false);

  const descriptionPreview = useMemo(() => {
    const template = formData.descriptionTemplate.trim();
    if (!template) return null;
    return previewDescriptionTemplate(template);
  }, [formData.descriptionTemplate]);

  const dueDateMethodHint = useMemo(
    () => getDueDateMethodHint(formData.dueDateMethod ?? 'days', formData.dueDays ?? 30),
    [formData.dueDateMethod, formData.dueDays],
  );

  const quantityHint = useMemo(
    () => getQuantityHint(formData.unitPrice, formData.quantity, formData.currency),
    [formData.unitPrice, formData.quantity, formData.currency],
  );

  useEffect(() => {
    if (!clientId) {
      setContracts([]);
      setContractsLoading(false);
      return;
    }
    setContractsLoading(true);
    contractService.getByClientId(clientId).then((list) => {
      setContracts(list);
      setContractsLoading(false);
    });
  }, [clientId]);

  const loadContracts = () => {
    if (!clientId) return;
    contractService.getByClientId(clientId).then(setContracts);
  };

  if (!clientId) {
    return (
      <div>
        <Button type="button" variant="secondary" onClick={() => navigateToPage('clients')} className="mb-4">
          Back to Clients
        </Button>
        <p className="text-[var(--text-muted)]">No client selected. Go back to Clients and click View on a client.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-[var(--text-muted)]">Loading</span></div>;
  }

  if (!client) {
    return (
      <div>
        <Button type="button" variant="secondary" onClick={() => navigateToPage('clients')} className="mb-4">
          Back to Clients
        </Button>
        <p className="text-[var(--text-muted)]">Client not found.</p>
      </div>
    );
  }

  const handleCreateContract = async () => {
    try {
      await contractService.create({
        ...formData,
        clientId,
        quantity: normalizeQuantity(formData.quantity),
      });
      setFormData(defaultContractForm);
      setShowForm(false);
      loadContracts();
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract');
    }
  };

  const handleUpdateContract = async (id: string) => {
    try {
      await contractService.update(id, {
        ...formData,
        quantity: normalizeQuantity(formData.quantity),
      });
      setEditing(null);
      setFormData(defaultContractForm);
      loadContracts();
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Failed to update contract');
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Delete this contract?')) return;
    try {
      await contractService.delete(id);
      loadContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Failed to delete contract');
    }
  };

  const startEdit = (contract: Contract) => {
    setEditing(contract.id);
    setFormData({
      clientId: contract.clientId,
      descriptionTemplate: contract.descriptionTemplate,
      unitPrice: contract.unitPrice,
      currency: contract.currency,
      quantity: contract.quantity,
      dueDays: contract.dueDays,
      dueDateMethod: contract.dueDateMethod || 'days',
    });
  };

  return (
    <div>
      <Button type="button" variant="secondary" onClick={() => navigateToPage('clients')} className="mb-6">
        Back to Clients
      </Button>

      <Card className="mb-8">
        <CardContent>
          <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-2">{client.companyName}</h1>
          {client.email && <p className="text-[var(--text-muted)] text-sm mb-1">{client.email}</p>}
          {client.address && <p className="text-[var(--text-muted)] text-sm">{client.address}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-[var(--text-main)]">Contracts for this client</h2>
        <Button
          variant="secondary"
          onClick={() => {
            setFormData({ ...defaultContractForm, clientId });
            setShowForm(!showForm);
            setEditing(null);
          }}
          data-coachmark="add-contract-btn"
        >
          {showForm ? 'Cancel' : 'Add Contract'}
        </Button>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Create contracts here, then open one to generate recurring invoices or create a custom invoice.
      </p>

      {showForm && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="text-base font-semibold text-[var(--text-main)] mb-4">New Contract</h3>
            <div className="space-y-4 max-w-lg">
              <div>
                <Input
                  label="Description Template"
                  value={formData.descriptionTemplate}
                  onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                  placeholder="Development Service — {{month}} {{year}}"
                  data-coachmark="contract-description-input"
                />
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Tokens: {'{{month}}'}, {'{{year}}'}
                </p>
                {descriptionPreview && (
                  <div className="mt-3 pt-3 border-t border-dashed border-[var(--border-color)]">
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Preview on invoice</p>
                    <p className="inline-flex max-w-full rounded-lg bg-[var(--color-primary-bkg)] px-3 py-2 text-sm text-[var(--text-main)]">
                      {descriptionPreview}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Sample for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
              <NumericInput
                label="Unit Price"
                placeholder="100000"
                value={formData.unitPrice}
                onChange={(unitPrice) => setFormData({ ...formData, unitPrice })}
                min={0}
                emptyValue={0}
              />
              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={CURRENCY_OPTIONS}
              />
              <div>
                <NumericInput
                  label="Quantity (optional)"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(quantity) => setFormData({ ...formData, quantity })}
                  allowDecimals={false}
                  emptyValue={0}
                />
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{quantityHint}</p>
              </div>
              <div>
                <Select
                  label="Due Date Method"
                  value={formData.dueDateMethod ?? 'days'}
                  onChange={(e) => setFormData({ ...formData, dueDateMethod: e.target.value as 'days' | 'endOfNextMonth' })}
                  options={[
                    { label: 'Fixed Days', value: 'days' },
                    { label: 'End of Next Month', value: 'endOfNextMonth' }
                  ]}
                />
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{dueDateMethodHint}</p>
              </div>
              {formData.dueDateMethod === 'days' && (
                <Input
                  label="Due Days"
                  type="number"
                  value={formData.dueDays}
                  onChange={(e) => setFormData({ ...formData, dueDays: parseInt(e.target.value, 10) || 30 })}
                />
              )}
              <Button onClick={handleCreateContract}>Create Contract</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {contractsLoading ? (
        <div className="text-center py-8 text-[var(--text-muted)] text-sm">Loading contracts…</div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">No contracts. Add a contract to generate recurring invoices.</div>
          </CardContent>
        </Card>
      ) : (
        <Table headers={['Description', 'Unit Price', 'Currency', 'Quantity', 'Due', 'Actions']}>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>
                {editing === contract.id ? (
                  <Input
                    value={formData.descriptionTemplate}
                    onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                    className="w-full"
                  />
                ) : (
                  contract.descriptionTemplate
                )}
              </TableCell>
              <TableCell>
                {editing === contract.id ? (
                  <NumericInput
                    placeholder="100000"
                    value={formData.unitPrice}
                    onChange={(unitPrice) => setFormData({ ...formData, unitPrice })}
                    min={0}
                    emptyValue={0}
                    className="w-full"
                  />
                ) : (
                  contract.unitPrice.toLocaleString()
                )}
              </TableCell>
              <TableCell>
                {editing === contract.id ? (
                  <Select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    options={CURRENCY_OPTIONS}
                    className="w-full min-w-[8rem]"
                  />
                ) : (
                  contract.currency
                )}
              </TableCell>
              <TableCell>
                {editing === contract.id ? (
                  <NumericInput
                    placeholder="1"
                    value={formData.quantity}
                    onChange={(quantity) => setFormData({ ...formData, quantity })}
                    allowDecimals={false}
                    emptyValue={0}
                    className="w-full"
                  />
                ) : (
                  String(contract.quantity)
                )}
              </TableCell>
              <TableCell>
                {(contract.dueDateMethod || 'days') === 'endOfNextMonth' ? 'End of next month' : `${contract.dueDays ?? 30} days`}
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {editing === contract.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateContract(contract.id)}
                        className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditing(null); setFormData(defaultContractForm); }}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigateToPage('contract-detail', clientId ?? undefined, contract.id)}
                        className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => startEdit(contract)}
                        className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContract(contract.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
