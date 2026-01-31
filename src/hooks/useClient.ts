import { useEffect, useState } from 'react';
import { clientService } from '@/storage/services';
import type { Client } from '@/domain/types';

export function useClient(clientId: string | null) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setClient(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    clientService.getById(clientId).then((c) => {
      if (!cancelled) {
        setClient(c ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return { client, loading };
}
