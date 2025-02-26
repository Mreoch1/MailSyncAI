import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import { connectOAuthProvider } from '@/lib/email-providers';
import { toast } from 'sonner';
import type { EmailProvider } from '@/types/database';

const OAUTH_CONFIGS = {
  gmail: {
    name: 'Gmail',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
    responseType: 'code',
    accessType: 'offline',
    prompt: 'consent',
    includeGrantedScopes: true,
  },
  outlook: {
    name: 'Outlook',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'offline_access Mail.Read Mail.Send Mail.ReadWrite User.Read',
    responseType: 'code',
    prompt: 'consent',
  },
  yahoo: {
    name: 'Yahoo',
    authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
    scope: 'mail-r mail-w',
    responseType: 'code',
    prompt: 'consent',
  },
} as const;

type SupportedProvider = keyof typeof OAUTH_CONFIGS;

export function ProviderAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const provider = searchParams.get('provider') as SupportedProvider;
  const code = searchParams.get('code');
  const error_description = searchParams.get('error_description');

  useEffect(() => {
    async function handleAuth() {
      // If there's an error from the provider
      if (error_description) {
        setError(error_description);
        setLoading(false);
        return;
      }

      // If we don't have a provider or code, redirect to dashboard
      if (!provider || !OAUTH_CONFIGS[provider]) {
        navigate('/dashboard');
        return;
      }

      // If we have a code, complete the OAuth flow
      if (code) {
        try {
          const result = await connectOAuthProvider(provider, code);
          toast.success(result.message);
          navigate('/dashboard');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to connect provider';
          setError(message);
          toast.error(message);
        } finally {
          setLoading(false);
        }
        return;
      }

      // If we just have a provider, start the OAuth flow
      const config = OAUTH_CONFIGS[provider];
      const clientId = import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`] as string;
      
      if (!clientId) {
        setError(`${config.name} integration is not configured`);
        setLoading(false);
        return;
      }

      // Build the OAuth URL
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/auth/provider`,
        response_type: config.responseType,
        scope: config.scope,
        access_type: config.accessType || 'offline',
        prompt: config.prompt || 'consent',
        state: provider, // Pass provider as state
      });

      // Redirect to provider's OAuth page
      window.location.href = `${config.authUrl}?${params.toString()}`;
    }

    handleAuth();
  }, [provider, code, error_description, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Authentication Error
            </CardTitle>
            <CardDescription>
              There was a problem connecting your email provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Connecting to {OAUTH_CONFIGS[provider]?.name || 'Provider'}
          </CardTitle>
          <CardDescription>
            Please wait while we connect your email account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}