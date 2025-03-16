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
  imap: 'IMAP',
  hotmail: 'HOTMAIL',
  live: 'OUTLOOK',
  msn: 'OUTLOOK',
  aol: 'AOL',
  protonmail: 'PROTONMAIL',
  zoho: 'ZOHO',
  icloud: 'ICLOUD',
  me: 'ICLOUD',
  mac: 'ICLOUD'
};

// Map email domains to providers
const EMAIL_DOMAIN_TO_PROVIDER = {
  'gmail.com': 'gmail',
  'googlemail.com': 'gmail',
  'outlook.com': 'outlook',
  'hotmail.com': 'hotmail',
  'live.com': 'live',
  'msn.com': 'msn',
  'yahoo.com': 'yahoo',
  'aol.com': 'aol',
  'protonmail.com': 'protonmail',
  'protonmail.ch': 'protonmail',
  'pm.me': 'protonmail',
  'zoho.com': 'zoho',
  'icloud.com': 'icloud',
  'me.com': 'me',
  'mac.com': 'mac'
};

// Function to detect provider from email
function detectProviderFromEmail(email: string): string | null {
  if (!email) return null;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  
  return EMAIL_DOMAIN_TO_PROVIDER[domain] || null;
}

export function ConnectionStatus() {
  const { settings, loading: settingsLoading } = useEmailSettings();
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null);

  // Get the user's email
  useEffect(() => {
    async function getUserEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        const detected = detectProviderFromEmail(user.email);
        setDetectedProvider(detected);
        console.log('Detected provider from email:', detected);
      }
    }
    
    getUserEmail();
  }, []);

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
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }
        
        // Check provider connection status
        const { data: status, error } = await supabase
          .from('provider_connection_status')
          .select('status, error_message, provider')
          .eq('user_id', user.id)
          .eq('provider', settings.provider)
          .single();

        if (error) {
          console.error('Error fetching connection status:', error);
          setStatus('error');
          setErrorMessage('Failed to check connection status');
          return;
        }

        if (status?.status === 'connected') {
          setStatus('connected');
          
          // Use detected provider if available, otherwise fall back to the one from settings
          let displayProvider = status.provider || settings.provider;
          
          // If we have a detected provider from the user's email, use that instead
          if (detectedProvider && userEmail) {
            console.log('Using detected provider:', detectedProvider);
            displayProvider = detectedProvider;
          }
          
          // Use the display name mapping or fallback to uppercase provider name
          setProviderName(PROVIDER_DISPLAY_NAMES[displayProvider] || displayProvider.toUpperCase());
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
  }, [settings, userEmail, detectedProvider]);

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