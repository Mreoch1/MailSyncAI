import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, TestTube2 } from 'lucide-react';
import { connectIMAP, testEmailConnection } from '@/lib/email-providers';
import { testConnection } from '@/lib/api';
import { useEmailSettings } from '@/hooks/use-email-settings';
import { toast } from 'sonner';
import type { EmailProvider } from '@/types/database';

type EmailProviderFormProps = {
  onSuccess: () => void;
};

const PROVIDER_CONFIGS = {
  gmail: {
    title: 'Gmail',
    description: 'Connect with your Google account',
    authType: 'oauth',
  },
  outlook: {
    title: 'Outlook',
    description: 'Connect with your Microsoft account',
    authType: 'oauth',
  },
  yahoo: {
    title: 'Yahoo',
    description: 'Connect with your Yahoo account',
    authType: 'oauth',
  },
  imap: {
    title: 'Custom IMAP',
    description: 'Connect to any email provider using IMAP',
    authType: 'credentials',
  },
} as const;

export function EmailProviderForm({ onSuccess }: EmailProviderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useEmailSettings();
  const [step, setStep] = useState<'connecting' | 'testing' | null>(null);
  const [testStatus, setTestStatus] = useState<{
    running: boolean;
    success?: boolean;
    message?: string;
  }>({ running: false });
  const navigate = useNavigate();
  const [provider, setProvider] = useState<EmailProvider>('gmail');
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Handle debounced navigation
  useEffect(() => {
    if (isNavigating && pendingNavigation) {
      const timer = setTimeout(() => {
        navigate(pendingNavigation);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isNavigating, pendingNavigation, navigate]);

  function clearError() {
    setError(null);
  }

  async function verifyAuthentication() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error('Please sign in to connect your email');
      navigate('/sign-in', { state: { returnTo: '/dashboard' } });
      throw new Error('Please sign in to connect your email');
    }
    return user;
  }

  async function handleOAuthLogin(provider: string): Promise<boolean> {
    try {
      setLoading(true);
      clearError();

      await verifyAuthentication();

      // Get the client ID from environment variables
      const clientId = import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`];
      if (!clientId) {
        throw new Error(`${provider} integration is not configured`);
      }

      // Configure OAuth parameters based on provider
      const config = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS];
      if (!config || config.authType !== 'oauth') {
        throw new Error('Invalid provider configuration');
      }

      // Build the OAuth URL based on provider
      const authUrl = provider === 'outlook' 
        ? 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
        : provider === 'gmail'
          ? 'https://accounts.google.com/o/oauth2/v2.0/auth'
          : 'https://api.login.yahoo.com/oauth2/request_auth';

      // Set up OAuth parameters
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/auth/provider`,
        response_type: 'code',
        scope: provider === 'outlook'
          ? 'offline_access Mail.Read Mail.Send Mail.ReadWrite User.Read'
          : provider === 'gmail'
            ? 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email'
            : 'mail-r mail-w',
        access_type: 'offline',
        prompt: 'consent',
        state: provider // Pass provider as state to maintain context
      });

      // Redirect to the provider's OAuth page
      window.location.href = `${authUrl}?${params.toString()}`;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect email provider';
      console.error('OAuth error:', message);
      setError(message);
      toast.error(`Connection failed: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleIMAPConnection(formData: FormData) {
    try {
      setLoading(true);
      setStep('connecting');
      clearError();

      await verifyAuthentication();

      const server = formData.get('server') as string;
      const port = formData.get('port') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      const portNum = parseInt(port);
      if (isNaN(portNum)) {
        throw new Error('Port must be a valid number');
      }

      toast.loading('Connecting to IMAP server...');
      const result = await connectIMAP({
        server,
        port: portNum,
        username,
        password,
        use_ssl: true,
      });

      setStep('testing');
      toast.loading('Testing connection...');

      // Test the connection
      await testEmailConnection('imap');
      
      toast.success(result.message);
      onSuccess();
      return true;
    } catch (error) {
      console.error('IMAP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to IMAP server';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
      setStep(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (loading || isNavigating) {
      return;
    }
    
    try {
      let success = false;
      if (provider === 'imap') {
        success = await handleIMAPConnection(new FormData(event.currentTarget));
      } else {
        success = await handleOAuthLogin(provider);
      }

      if (success && !isNavigating) {
        toast.success(`${PROVIDER_CONFIGS[provider].title} connected successfully`);
        onSuccess();
      }
    } catch (error) {
      console.error('Connection error:', error);
      const message = error instanceof Error ? error.message : 'Failed to connect email provider';
      setError(message);
      toast.error(message);
    }
  }

  async function handleTestConnection() {
    setTestStatus({ running: true });
    setError(null);

    try {
      const result = await testConnection();
      setTestStatus({
        running: false,
        success: true,
        message: result.message,
      });
      toast.success('Connection test completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test failed';
      setTestStatus({
        running: false,
        success: false,
        message,
      });
      toast.error(`Connection test failed: ${message}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Label htmlFor="provider">Email Provider</Label>
        <Select
          value={provider}
          onValueChange={(value) => {
            setProvider(value as EmailProvider);
            clearError();
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-full text-center">
            <SelectValue className="text-center" placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent align="center" className="w-[300px] text-center">
            {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col gap-0.5 text-center w-full">
                  <span>{config.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {provider === 'imap' && (
        <>
          <div className="space-y-3">
            <Label htmlFor="server">IMAP Server</Label>
            <Input
              id="server"
              name="server"
              placeholder="imap.example.com"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              name="port"
              type="number"
              placeholder="993"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="email"
              placeholder="your.email@example.com"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              For Gmail and other providers, use an App Password. Never use your main account password.
            </p>
          </div>
        </>
      )}

      <Button type="submit" disabled={loading || isNavigating} className="w-full mt-6">
        <span className="mx-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {step === 'connecting' 
                ? `Connecting to ${PROVIDER_CONFIGS[provider].title}...`
                : 'Testing connection...'}
            </div>
          )}
          {isNavigating && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting...
            </div>
          )}
          {!loading && !isNavigating && `Connect ${PROVIDER_CONFIGS[provider].title}`}
        </span>
      </Button>

      {settings?.provider && (
        <div className="mt-6 space-y-4 border-t pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Test Connection</h4>
              <p className="text-sm text-muted-foreground">
                Verify that email processing is working correctly
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testStatus.running}
            >
              {testStatus.running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube2 className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {testStatus.message && (
            <Alert variant={testStatus.success ? "default" : "destructive"}>
              <AlertTitle>
                {testStatus.success ? "Test Successful" : "Test Failed"}
              </AlertTitle>
              <AlertDescription>
                {testStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="text-xs text-center text-muted-foreground space-y-2 mt-6">
        <p>Your email provider will be connected securely.</p>
        <p>A test email will be sent to verify the connection works.</p>
        {!error && (
          <p className="text-yellow-500 font-medium">
            Note: Email provider integration is in development mode.
            Connections will be simulated for testing.
          </p>
        )}
      </div>
    </form>
  );
}