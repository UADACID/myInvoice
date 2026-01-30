import { useEffect, useState } from 'react';
import { invoiceService } from '@/storage/services';
import type { Invoice } from '@/domain/types';
import { liveQuery } from 'dexie';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = liveQuery(() => invoiceService.getAll()).subscribe({
      next: (data) => {
        setInvoices(data);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching invoices:', error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshInvoices = async () => {
    const data = await invoiceService.getAll();
    setInvoices(data);
  };

  return { invoices, loading, refreshInvoices };
}
