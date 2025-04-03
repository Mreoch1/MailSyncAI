import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setStatus('loading');
        setError(null);

        // Get user's email settings
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        // Get user's email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (!profile?.email) {
          setStatus('disconnected');
          return;
        }

        // Map email domain to provider
        const emailDomain = profile.email.split('@')[1].toLowerCase();
        const providerMap: Record<string, string> = {
          'gmail.com': 'gmail',
          'googlemail.com': 'gmail',
          'outlook.com': 'outlook',
          'hotmail.com': 'outlook',
          'live.com': 'outlook',
          'msn.com': 'outlook',
          'yahoo.com': 'yahoo',
          'ymail.com': 'yahoo'
        };

        const provider = providerMap[emailDomain] || 'unknown';
        if (provider === 'unknown') {
          setStatus('disconnected');
          return;
        }

        // Check provider connection status
        const { data: connectionStatus } = await supabase
          .from('provider_connection_status')
          .select('status, error_message')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .single();

        if (!connectionStatus || connectionStatus.status !== 'connected') {
          setStatus('disconnected');
          if (connectionStatus?.error_message) {
            setError(connectionStatus.error_message);
          }
          return;
        }

        // Verify credentials exist and are valid
        const { data: credentials } = await supabase
          .from('email_provider_credentials')
          .select('is_valid, last_validated')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .single();

        if (!credentials || !credentials.is_valid) {
          setStatus('disconnected');
          setError('Credentials are invalid or expired');
          return;
        }

        setStatus('connected');
      } catch (error) {
        console.error('Connection check error:', error);
        setStatus('disconnected');
        setError(error instanceof Error ? error.message : 'Failed to check connection');
      }
    };

    checkConnection();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Checking connection...</span>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Not Connected</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
        >
          Connect Email
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="success">Connected</Badge>
    </div>
  );
}