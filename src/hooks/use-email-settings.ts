import { useEffect, useState, useCallback } from 'react';
import { getEmailSettings } from '@/lib/api';
import type { EmailSettings } from '@/types/database';

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getEmailSettings();
        setSettings(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [refreshKey]);

  return { settings, loading, error, refetch };
}