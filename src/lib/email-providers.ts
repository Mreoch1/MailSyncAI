import { supabase } from './supabase';
import type { EmailProvider } from '@/types/database';
import { updateEmailSettings, testConnection } from '@/lib/api';

// Development mode OAuth configurations
const DEV_OAUTH_CONFIGS = {
  gmail: {
    clientId: '1234567890-example.apps.googleusercontent.com',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ].join(' '),
  },
  outlook: {
    clientId: 'your-outlook-client-id',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'offline_access Mail.Read Mail.Send',
  },
  yahoo: {
    clientId: 'your-yahoo-client-id',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'mail-r mail-w',
  },
};

// Development mode credentials
const DEV_CREDENTIALS = {
  gmail: {
    access_token: 'dev-gmail-access-token',
    refresh_token: 'dev-gmail-refresh-token',
    expiry_date: new Date(Date.now() + 3600000).toISOString(),
    email: 'dev.user@gmail.com',
  },
  outlook: {
    access_token: 'dev-outlook-access-token',
    refresh_token: 'dev-outlook-refresh-token',
    expiry_date: new Date(Date.now() + 3600000).toISOString(),
    email: 'dev.user@outlook.com',
  },
  yahoo: {
    access_token: 'dev-yahoo-access-token',
    refresh_token: 'dev-yahoo-refresh-token',
    expiry_date: new Date(Date.now() + 3600000).toISOString(),
    email: 'dev.user@yahoo.com',
  },
};

// Log connection attempt
async function logConnection(
  userId: string,
  provider: string,
  status: string,
  error?: string,
  details: Record<string, any> = {}
) {
  await supabase
    .from('email_connection_logs')
    .insert({
      user_id: userId,
      provider,
      status,
      error,
      details,
    });
}

// Connect OAuth provider
export async function connectOAuthProvider(provider: EmailProvider) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Update connection status to connecting
  await supabase
    .from('provider_connection_status')
    .upsert({
      user_id: user.id,
      provider,
      status: 'connecting',
      last_check: new Date().toISOString(),
    });

  try {
    // Check for existing credentials
    const { data: existingCreds } = await supabase
      .from('email_provider_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (existingCreds) {
      await logConnection(user.id, provider, 'already_connected');
      
      // Update connection status
      await supabase
        .from('provider_connection_status')
        .upsert({
          user_id: user.id,
          provider,
          status: 'connected',
          last_check: new Date().toISOString(),
        });

      return {
        success: true,
        message: `${provider} already connected`,
      };
    }

    // In development, simulate OAuth flow
    const credentials = DEV_CREDENTIALS[provider];
    
    // Save encrypted credentials
    const { error: saveError } = await supabase
      .from('email_provider_credentials')
      .upsert({
        user_id: user.id,
        provider,
        credentials: {
          ...credentials,
          scope: DEV_OAUTH_CONFIGS[provider].scope,
        },
        is_valid: true,
      }, {
        onConflict: 'user_id,provider',
      });

    if (saveError) {
      console.error('Failed to save credentials:', saveError);
      throw new Error('Failed to save provider credentials');
    }

    // Update email settings
    await updateEmailSettings({
      provider,
      summary_time: '09:00',
      important_only: false,
    });

    // Update connection status
    await supabase
      .from('provider_connection_status')
      .upsert({
        user_id: user.id,
        provider,
        status: 'connected',
        last_check: new Date().toISOString(),
        error_message: null,
      });

    // Log successful connection
    await supabase
      .from('email_processing_logs')
      .insert({
        user_id: user.id,
        event_type: 'provider_connected',
        status: 'success',
        details: { provider, dev_mode: true },
      });

    // Test the connection
    await testConnection();

    return {
      success: true,
      message: `${provider} connected successfully (Development Mode)`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    
    // Log connection error
    await supabase
      .from('provider_connection_status')
      .upsert({
        user_id: user.id,
        provider,
        status: 'error',
        last_check: new Date().toISOString(),
        error_message: message,
      });

    await supabase
      .from('email_processing_logs')
      .insert({
        user_id: user.id,
        event_type: 'provider_connected',
        status: 'error',
        error: message,
        details: { provider },
      });

    throw error;
  }
}

// Refresh OAuth tokens
async function refreshOAuthTokens(provider: EmailProvider, refreshToken: string) {
  // In development, simulate token refresh
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    access_token: `new-${provider}-access-token`,
    refresh_token: refreshToken,
    expiry_date: new Date(Date.now() + 3600000).toISOString(),
  };
}

// Validate provider connection
export async function validateProviderConnection(provider: EmailProvider) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // Get provider credentials
    const { data: creds } = await supabase
      .from('email_provider_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (!creds) {
      throw new Error('Provider not connected');
    }

    // Check if tokens need refresh
    const expiryDate = new Date(creds.credentials.expiry_date);
    if (expiryDate <= new Date()) {
      const newTokens = await refreshOAuthTokens(
        provider,
        creds.credentials.refresh_token
      );

      // Update credentials
      await supabase
        .from('email_provider_credentials')
        .update({
          credentials: {
            ...creds.credentials,
            ...newTokens,
          },
          is_valid: true,
          last_validated: new Date().toISOString(),
        })
        .eq('id', creds.id);
    }

    // Test connection
    await testConnection();
    
    return {
      success: true,
      message: 'Provider connection is valid',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    
    // Update status
    await supabase
      .from('email_processing_status')
      .update({
        is_connected: false,
        last_error: message,
      })
      .eq('user_id', user.id);

    throw error;
  }
}

// Connect IMAP provider
export async function connectIMAP(config: {
  server: string;
  port: number;
  username: string;
  password: string;
  use_ssl?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // Validate IMAP settings
    if (!config.server || !config.port || !config.username || !config.password) {
      throw new Error('All IMAP fields are required');
    }

    // In development, simulate IMAP connection test
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Save IMAP credentials
    const { error: saveError } = await supabase
      .from('imap_connections')
      .insert({
        user_id: user.id,
        ...config,
        email: config.username,
      });

    if (saveError) throw saveError;

    // Update email settings
    await supabase
      .from('email_settings')
      .upsert({
        user_id: user.id,
        provider: 'imap',
      });

    await logConnection(user.id, 'imap', 'connected', null, {
      server: config.server,
      port: config.port,
      username: config.username,
      dev_mode: true,
    });

    return {
      success: true,
      message: 'IMAP server connected successfully (Development Mode)',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    await logConnection(user.id, 'imap', 'error', message);
    throw error;
  }
}

// Test email provider connection
export async function testEmailConnection(provider: EmailProvider | 'imap') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // In development, simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));

    await logConnection(user.id, provider, 'test_success', null, {
      dev_mode: true,
    });

    return {
      success: true,
      message: 'Connection test successful (Development Mode)',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Test failed';
    await logConnection(user.id, provider, 'test_error', message);
    throw error;
  }
}