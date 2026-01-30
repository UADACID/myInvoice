import { useEffect, useState } from 'react';
import { settingsService } from '@/storage/services';
import type { Settings } from '@/domain/types';
import { liveQuery } from 'dexie';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = liveQuery(() => settingsService.get()).subscribe({
      next: (data) => {
        setSettings(data);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching settings:', error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return { settings, loading };
}
