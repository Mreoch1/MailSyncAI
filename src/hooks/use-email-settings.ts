import { useEffect, useState } from 'react';
import { getEmailSettings } from '@/lib/api';
import type { EmailSettings } from '@/types/database';

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
  }, []);

  return { settings, loading, error };
}