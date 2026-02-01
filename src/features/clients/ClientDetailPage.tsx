import { useState, useEffect } from 'react';
import { useClient } from '@/hooks/useClient';
import { contractService } from '@/storage/services';
import { Button, Card, CardContent, Input, Table, TableRow, TableCell, Select } from '@/components';
import type { Contract } from '@/domain/types';

export interface ClientDetailPageProps {
  clientId: string | null;
  onNavigate: (page: string, clientId?: string, contractId?: string) => void;
}

const defaultContractForm: Omit<Contract, 'id'> = {
  clientId: '',
  descriptionTemplate: '',
  unitPrice: 0,
  currency: 'JPY',
  quantity: 1,
  dueDays: 30,
  dueDateMethod: 'days',
};

export function ClientDetailPage({ clientId, onNavigate }: ClientDetailPageProps) {
  const { client, loading } = useClient(clientId);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Contract, 'id'>>(defaultContractForm);
  const [showForm, setShowForm] = useState(false);

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
        <Button type="button" variant="secondary" onClick={() => onNavigate('clients')} className="mb-4">
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
        <Button type="button" variant="secondary" onClick={() => onNavigate('clients')} className="mb-4">
          Back to Clients
        </Button>
        <p className="text-[var(--text-muted)]">Client not found.</p>
      </div>
    );
  }

  const handleCreateContract = async () => {
    try {
      await contractService.create({ ...formData, clientId });
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
      await contractService.update(id, formData);
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
      <Button type="button" variant="secondary" onClick={() => onNavigate('clients')} className="mb-6">
        Back to Clients
      </Button>

      <Card className="mb-8">
        <CardContent>
          <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-2">{client.companyName}</h1>
          {client.email && <p className="text-[var(--text-muted)] text-sm mb-1">{client.email}</p>}
          {client.address && <p className="text-[var(--text-muted)] text-sm">{client.address}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-main)]">Contracts</h2>
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

      {showForm && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="text-base font-semibold text-[var(--text-main)] mb-4">New Contract</h3>
            <div className="space-y-4 max-w-lg">
              <Input
                label="Description Template"
                value={formData.descriptionTemplate}
                onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                placeholder="Development Service — {{month}} {{year}}"
              />
              <Input
                label="Unit Price"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
              <Input
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
              />
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
                  <Input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full"
                  />
                ) : (
                  contract.unitPrice.toLocaleString()
                )}
              </TableCell>
              <TableCell>
                {editing === contract.id ? (
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full"
                  />
                ) : (
                  contract.currency
                )}
              </TableCell>
              <TableCell>
                {editing === contract.id ? (
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
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
                        onClick={() => onNavigate('contract-detail', undefined, contract.id)}
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
