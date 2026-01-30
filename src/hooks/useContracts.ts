import { useEffect, useState } from 'react';
import { contractService } from '@/storage/services';
import type { Contract } from '@/domain/types';
import { liveQuery } from 'dexie';

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = liveQuery(() => contractService.getAll()).subscribe({
      next: (data) => {
        setContracts(data);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching contracts:', error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return { contracts, loading };
}
