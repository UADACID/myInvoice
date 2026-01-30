import { useEffect, useState } from 'react';
import { clientService } from '@/storage/services';
import type { Client } from '@/domain/types';
import { liveQuery } from 'dexie';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = liveQuery(() => clientService.getAll()).subscribe({
      next: (data) => {
        setClients(data);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return { clients, loading };
}
