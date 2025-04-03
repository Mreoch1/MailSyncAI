import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  grantType: string;
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  gmail: {
    clientId: Deno.env.get('GMAIL_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GMAIL_CLIENT_SECRET') || '',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    grantType: 'authorization_code',
  },
  outlook: {
    clientId: Deno.env.get('OUTLOOK_CLIENT_ID') || '',
    clientSecret: Deno.env.get('OUTLOOK_CLIENT_SECRET') || '',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    grantType: 'authorization_code',
  },
  yahoo: {
    clientId: Deno.env.get('YAHOO_CLIENT_ID') || '',
    clientSecret: Deno.env.get('YAHOO_CLIENT_SECRET') || '',
    tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
    grantType: 'authorization_code',
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Get request data
    const { provider, code, redirect_uri } = await req.json();

    if (!provider || !code || !redirect_uri) {
      throw new Error('Missing required parameters');
    }

    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri,
        grant_type: config.grantType,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user email from provider
    let email = '';
    if (provider === 'outlook') {
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        email = userData.userPrincipalName;
      }
    }

    // Save credentials to database
    const { error: upsertError } = await supabaseClient
      .from('email_provider_credentials')
      .upsert({
        user_id: user.id,
        provider,
        credentials: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          email: email
        },
        is_valid: true,
        last_validated: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (upsertError) {
      console.error('Error saving credentials:', upsertError);
      throw new Error('Failed to save credentials');
    }

    // Update provider connection status
    const { error: statusError } = await supabaseClient
      .from('provider_connection_status')
      .upsert({
        user_id: user.id,
        provider,
        status: 'connected',
        last_check: new Date().toISOString(),
        error_message: null
      }, {
        onConflict: 'user_id,provider'
      });

    if (statusError) {
      console.error('Error updating connection status:', statusError);
    }

    // Log the successful exchange
    await supabaseClient
      .from('email_processing_logs')
      .insert({
        user_id: user.id,
        event_type: 'oauth_exchange',
        status: 'success',
        details: { provider, email },
      });

    return new Response(
      JSON.stringify(tokens),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('OAuth exchange error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
}); 