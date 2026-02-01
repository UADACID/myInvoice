import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { useContracts } from '@/hooks/useContracts';
import { clientService } from '@/storage/services';
import { Button, Input, Card, CardContent, Select } from '@/components';
import type { Client } from '@/domain/types';

// Modern palette – full-fill cards with white text (saturated enough for contrast)
export function ClientsPage() {
  const { clients, loading } = useClients();
  const { contracts } = useContracts();
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    companyName: '',
    address: '',
    email: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'nameDesc'>('name');

  const contractCountByClient = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of contracts) {
      map[c.clientId] = (map[c.clientId] ?? 0) + 1;
    }
    return map;
  }, [contracts]);

  const filteredAndSortedClients = useMemo(() => {
    let list = clients;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const cmp = a.companyName.localeCompare(b.companyName);
      return sortBy === 'name' ? cmp : -cmp;
    });
    return list;
  }, [clients, searchQuery, sortBy]);

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

  if (loading) {
    return <div className="text-center py-16"><span className="text-sm text-slate-400">Loading</span></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Clients</h1>
        <Button onClick={() => setShowForm(!showForm)} variant="secondary" data-coachmark="add-client-btn">
          {showForm ? 'Cancel' : 'Add Client'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8" data-coachmark="client-form">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6">New Client</h2>
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

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Search"
                type="text"
                placeholder="Search by name, address, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'nameDesc')}
                options={[
                  { label: 'Name A–Z', value: 'name' },
                  { label: 'Name Z–A', value: 'nameDesc' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedClients.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-16">
              <p className="text-[var(--text-main)] text-base mb-1">No clients</p>
              <p className="text-[var(--text-muted)] text-sm">{searchQuery ? 'Try a different search.' : 'Add your first client.'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedClients.map((client) => (
            <Card key={client.id} className="flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-[var(--text-main)] mb-1">{client.companyName}</h3>
                {client.email && <p className="text-sm text-[var(--text-muted)] mb-2">{client.email}</p>}
                <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">{client.address || '—'}</p>
                <p className="text-xs text-[var(--text-muted)] mb-4 mt-auto opacity-70">
                  {contractCountByClient[client.id] ?? 0} contract{(contractCountByClient[client.id] ?? 0) !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="secondary"
                  className="w-full justify-center mt-2 group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)]"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'client-detail', clientId: client.id } }));
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
