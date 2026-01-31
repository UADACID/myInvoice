import { useState } from 'react';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { contractService } from '@/storage/services';
import { Table, TableRow, TableCell, Button, Input, Card, CardContent } from '@/components';
import type { Contract } from '@/domain/types';

export function ContractsPage() {
  const { contracts, loading } = useContracts();
  const { clients } = useClients();
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Contract, 'id'>>({
    clientId: '',
    descriptionTemplate: '',
    unitPrice: 0,
    currency: 'JPY',
    quantity: 1,
    dueDays: 30,
    dueDateMethod: 'days',
  });
  const [showForm, setShowForm] = useState(false);

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.companyName || 'Unknown';
  };

  const handleCreate = async () => {
    try {
      await contractService.create(formData);
      setFormData({
        clientId: '',
        descriptionTemplate: '',
        unitPrice: 0,
        currency: 'JPY',
        quantity: 1,
        dueDays: 30,
        dueDateMethod: 'days',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await contractService.update(id, formData);
      setEditing(null);
      setFormData({
        clientId: '',
        descriptionTemplate: '',
        unitPrice: 0,
        currency: 'JPY',
        quantity: 1,
        dueDays: 30,
        dueDateMethod: 'days',
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Failed to update contract');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this contract?')) {
      try {
        await contractService.delete(id);
      } catch (error) {
        console.error('Error deleting contract:', error);
        alert('Failed to delete contract');
      }
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

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-slate-400">Loading</span></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Contracts</h1>
        <Button onClick={() => setShowForm(!showForm)} variant="secondary" data-coachmark="add-contract-btn">
          {showForm ? 'Cancel' : 'Add Contract'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 mb-6">New Contract</h2>
            <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2.5">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-slate-900"
                required
                data-coachmark="contract-client-select"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Description Template"
              value={formData.descriptionTemplate}
              data-coachmark="contract-description-input"
              onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
              placeholder="Development Service — {{month}} {{year}}"
              required
            />
            <p className="text-sm text-slate-500">Use {'{month}'} and {'{year}'} as placeholders</p>
            <Input
              label="Unit Price"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              required
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
              <label className="block text-sm font-medium text-slate-700 mb-2.5">Due Date Method</label>
              <select
                value={formData.dueDateMethod || 'days'}
                onChange={(e) => setFormData({ ...formData, dueDateMethod: e.target.value as 'days' | 'endOfNextMonth' })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-slate-900"
              >
                <option value="days">Fixed Days</option>
                <option value="endOfNextMonth">End of Next Month</option>
              </select>
            </div>
            {formData.dueDateMethod === 'days' && (
              <Input
                label="Due Days"
                type="number"
                value={formData.dueDays}
                onChange={(e) => setFormData({ ...formData, dueDays: parseInt(e.target.value) || 30 })}
              />
            )}
            <Button onClick={handleCreate}>Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {contracts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-16">
              <p className="text-slate-600 text-base mb-1">No contracts</p>
              <p className="text-slate-400 text-sm">Contracts are used to generate invoices</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Table headers={['Client', 'Description Template', 'Unit Price', 'Currency', 'Quantity', 'Due Date', 'Actions']}>
          {contracts.map((contract) => (
          <TableRow key={contract.id}>
            <TableCell>
              {editing === contract.id ? (
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              ) : (
                getClientName(contract.clientId)
              )}
            </TableCell>
            <TableCell>
              {editing === contract.id ? (
                <Input
                  value={formData.descriptionTemplate}
                  onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                  className="w-full"
                  required
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
                  required
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
                contract.quantity
              )}
            </TableCell>
            <TableCell>
              {editing === contract.id ? (
                <div className="space-y-2">
                  <select
                    value={formData.dueDateMethod || 'days'}
                    onChange={(e) => setFormData({ ...formData, dueDateMethod: e.target.value as 'days' | 'endOfNextMonth' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="days">Fixed Days</option>
                    <option value="endOfNextMonth">End of Next Month</option>
                  </select>
                  {formData.dueDateMethod === 'days' && (
                    <Input
                      type="number"
                      value={formData.dueDays}
                      onChange={(e) => setFormData({ ...formData, dueDays: parseInt(e.target.value) || 30 })}
                      className="w-full"
                    />
                  )}
                </div>
              ) : (
                (contract.dueDateMethod || 'days') === 'endOfNextMonth' ? 'End of Next Month' : `${contract.dueDays || 30} days`
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-4">
                {editing === contract.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(contract.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setFormData({
                          clientId: '',
                          descriptionTemplate: '',
                          unitPrice: 0,
                          currency: 'JPY',
                          quantity: 1,
                          dueDays: 30,
                          dueDateMethod: 'days',
                        });
                      }}
                      className="text-sm text-slate-600 hover:text-slate-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contract-detail', contractId: contract.id } }));
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => startEdit(contract)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
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
