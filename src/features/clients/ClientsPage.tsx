import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { clientService } from '@/storage/services';
import { Table, TableRow, TableCell, Button, Input, Card, CardContent } from '@/components';
import type { Client } from '@/domain/types';

export function ClientsPage() {
  const { clients, loading } = useClients();
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    companyName: '',
    address: '',
    email: '',
  });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    try {
      await clientService.create(formData);
      setFormData({ companyName: '', address: '', email: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await clientService.update(id, formData);
      setEditing(null);
      setFormData({ companyName: '', address: '', email: '' });
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this client?')) {
      try {
        await clientService.delete(id);
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      }
    }
  };

  const startEdit = (client: Client) => {
    setEditing(client.id);
    setFormData({
      companyName: client.companyName,
      address: client.address,
      email: client.email,
    });
  };

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-slate-400">Loading</span></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
        <Button onClick={() => setShowForm(!showForm)} variant="secondary" data-coachmark="add-client-btn">
          {showForm ? 'Cancel' : 'Add Client'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8" data-coachmark="client-form">
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 mb-6">New Client</h2>
            <div className="space-y-5 max-w-lg">
            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Button onClick={handleCreate}>Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {clients.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-16">
              <p className="text-slate-600 text-base mb-1">No clients</p>
              <p className="text-slate-400 text-sm">Add your first client</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Table headers={['Company Name', 'Address', 'Email', 'Actions']}>
          {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              {editing === client.id ? (
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full"
                />
              ) : (
                client.companyName
              )}
            </TableCell>
            <TableCell>
              {editing === client.id ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full"
                />
              ) : (
                client.address
              )}
            </TableCell>
            <TableCell>
              {editing === client.id ? (
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full"
                />
              ) : (
                client.email
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-4">
                {editing === client.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(client.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-sm text-slate-600 hover:text-slate-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(client)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
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
