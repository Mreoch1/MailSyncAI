import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { EmailProviderForm } from './email-provider-form';

export function ConnectionStatus() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkConnection() {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get user settings to determine provider
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('email_provider')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          console.error('Error fetching settings:', settingsError);
          setIsConnected(false);
          return;
        }

        if (!settings?.email_provider) {
          setIsConnected(false);
          return;
        }

        // Map hotmail/live/msn to outlook
        const provider = settings.email_provider.toLowerCase();
        const mappedProvider = provider === 'hotmail' || provider === 'live' || provider === 'msn' ? 'outlook' : provider;

        // Check credentials
        const { data: credentials, error: credentialsError } = await supabase
          .from('email_provider_credentials')
          .select('is_valid, last_validated')
          .eq('user_id', user.id)
          .eq('provider', mappedProvider)
          .single();

        if (credentialsError) {
          console.error('Error checking credentials:', credentialsError);
          setIsConnected(false);
          return;
        }

        // Check if credentials are valid and not expired
        const isValid = credentials?.is_valid && 
          credentials?.last_validated && 
          new Date(credentials.last_validated).getTime() > Date.now() - 24 * 60 * 60 * 1000;

        setIsConnected(isValid);
      } catch (err) {
        console.error('Error checking connection:', err);
        setError('Failed to check connection status');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkConnection();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Checking connection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Error</Badge>
        <span className="text-sm text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Badge variant="success">Connected</Badge>
            <span className="text-sm text-muted-foreground">Your email is connected</span>
          </>
        ) : (
          <>
            <Badge variant="warning">Disconnected</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectDialog(true)}
            >
              Connect Email
            </Button>
          </>
        )}
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Your Email</DialogTitle>
            <DialogDescription>
              Choose your email provider and authorize access to your account.
            </DialogDescription>
          </DialogHeader>
          <EmailProviderForm 
            onSuccess={() => {
              setShowConnectDialog(false);
              // Refresh the connection status
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1000);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
}