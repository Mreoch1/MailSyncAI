import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AuthProviderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const provider = state?.split(':')[0];

        if (!code || !provider) {
          throw new Error('Missing required parameters');
        }

        // Exchange the code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke('oauth-exchange', {
          body: {
            code,
            provider,
            redirect_uri: window.location.origin + '/auth/provider'
          }
        });

        if (exchangeError) {
          throw exchangeError;
        }

        if (data?.success) {
          toast.success(`Successfully connected ${provider} account`);
          navigate('/dashboard');
        } else {
          throw new Error('Failed to exchange OAuth code');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error instanceof Error ? error.message : 'Failed to complete OAuth flow');
        toast.error('Failed to connect email provider');
        navigate('/dashboard');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="mt-4 text-gray-600">Completing OAuth flow...</p>
    </div>
  );
} 