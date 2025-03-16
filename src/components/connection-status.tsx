import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useEmailSettings } from '@/hooks/use-email-settings';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// Map provider names to display names
const PROVIDER_DISPLAY_NAMES = {
  gmail: 'GMAIL',
  outlook: 'OUTLOOK',
  yahoo: 'YAHOO',
  imap: 'IMAP'
};

export function ConnectionStatus() {
  const { settings, loading: settingsLoading } = useEmailSettings();
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      if (!settings?.provider) {
        setStatus('disconnected');
        setErrorMessage(null);
        setProviderName(null);
        return;
      }

      try {
        setStatus('checking');
        setErrorMessage(null);
        
        // Check provider connection status
        const { data: status } = await supabase
          .from('provider_connection_status')
          .select('status, error_message')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('provider', settings.provider)
          .single();

        if (status?.status === 'connected') {
          setStatus('connected');
          // Use the display name mapping or fallback to uppercase provider name
          setProviderName(PROVIDER_DISPLAY_NAMES[settings.provider] || settings.provider.toUpperCase());
        } else {
          setStatus('error');
          setErrorMessage(status?.error_message || 'Provider not connected');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Connection test failed';
        setErrorMessage(message);
      }
    }

    if (settings) {
      checkConnection();
    }
  }, [settings]);

  if (settingsLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking connection...
      </Badge>
    );
  }

  if (status === 'checking') {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Testing connection...
      </Badge>
    );
  }

  if (status === 'connected') {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Connected to {providerName}
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {errorMessage || 'Connection error'}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Not connected
    </Badge>
  );
}