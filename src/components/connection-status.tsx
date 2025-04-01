import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useEmailSettings } from '@/hooks/use-email-settings';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const [isSimulated, setIsSimulated] = useState(false);
  const navigate = useNavigate();

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

  // Create a simulated connection if needed
  async function createSimulatedConnection(userId: string, provider: string, email: string) {
    console.log('Creating simulated connection for', provider);
    setIsSimulated(true);
    
    try {
      // Create a simulated provider connection status
      await supabase
        .from('provider_connection_status')
        .upsert({
          user_id: userId,
          provider: provider,
          status: 'connected',
          last_check: new Date().toISOString(),
          error_message: null
        });
        
      // Create simulated credentials
      await supabase
        .from('email_provider_credentials')
        .upsert({
          user_id: userId,
          provider: provider,
          credentials: {
            access_token: `simulated_${provider}_token_${Date.now()}`,
            refresh_token: `simulated_refresh_token_${Date.now()}`,
            expiry_date: new Date(Date.now() + 3600 * 1000).toISOString(),
            email: email
          },
          is_valid: true,
          last_validated: new Date().toISOString()
        });
        
      setStatus('connected');
      setProviderName(PROVIDER_DISPLAY_NAMES[provider] || provider.toUpperCase());
      
      // Show a toast notification
      toast.success(`Simulated connection created for ${provider.toUpperCase()} in development mode`);
      
      return true;
    } catch (error) {
      console.error('Failed to create simulated connection:', error);
      return false;
    }
  }

  // Get connection status
  useEffect(() => {
    async function checkConnection() {
      if (!settings?.provider) {
        setStatus('disconnected');
        return;
      }

      try {
        const { data: credentials } = await supabase
          .from('email_provider_credentials')
          .select('is_valid')
          .eq('user_id', settings.user_id)
          .eq('provider', settings.provider)
          .single();

        if (!credentials?.is_valid) {
          setStatus('disconnected');
          return;
        }

        setStatus('connected');
        setProviderName(PROVIDER_DISPLAY_NAMES[settings.provider] || settings.provider.toUpperCase());
      } catch (error) {
        console.error('Connection check failed:', error);
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Connection check failed';
        setErrorMessage(message);
      }
    }

    if (!settingsLoading) {
      checkConnection();
    }
  }, [settings, settingsLoading]);

  if (settingsLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (status === 'disconnected' || !settings?.provider) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Not Connected
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard')}
          className="ml-2"
        >
          Connect Email
        </Button>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <Badge variant="outline" className="text-green-500 border-green-500">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Connected to {providerName}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-red-500 border-red-500">
      <XCircle className="h-3 w-3 mr-1" />
      {errorMessage || 'Connection Error'}
    </Badge>
  );
}