import { useEffect, useState } from 'react';
import { contractService } from '@/storage/services';
import type { Contract } from '@/domain/types';

export function useContract(contractId: string | null) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractId) {
      setContract(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    contractService.getById(contractId).then((c) => {
      if (!cancelled) {
        setContract(c ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  return { contract, loading };
}
