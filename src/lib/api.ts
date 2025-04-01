import { supabase } from './supabase';
import type { Profile, EmailSettings, EmailSummary, EmailTemplate, EmailBatch } from '@/types/database';

export async function testConnection() {
  try {
    console.log('Starting connection test');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('Not authenticated');
    }

    console.log('Fetching email settings for user:', user.id);
    // Get user's email settings
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
      throw new Error(`Failed to fetch email settings: ${settingsError.message}`);
    }

    if (!settings?.provider) {
      console.error('No email provider configured');
      throw new Error('Please connect your email provider first');
    }

    // Check provider connection status
    console.log('Checking provider connection status for:', settings.provider);
    
    // Get provider credentials
    const { data: credentials, error: credsError } = await supabase
      .from('email_provider_credentials')
      .select('credentials, is_valid, last_validated')
      .eq('user_id', user.id)
      .eq('provider', settings.provider)
      .maybeSingle();
      
    if (credsError) {
      console.error('Error fetching provider credentials:', credsError);
      throw new Error(`Failed to fetch provider credentials: ${credsError.message}`);
    }
    
    if (!credentials) {
      console.error('No provider credentials found');
      throw new Error('No email provider credentials found. Please reconnect your email provider.');
    }
    
    if (!credentials.is_valid) {
      console.error('Provider credentials are invalid');
      throw new Error(`Your ${settings.provider.toUpperCase()} credentials are invalid. Please reconnect your email provider.`);
    }
    
    // Check if tokens need to be refreshed
    if (credentials.credentials.expiry_date) {
      const expiryDate = new Date(credentials.credentials.expiry_date);
      const now = new Date();
      
      // If token expires in less than 5 minutes or is already expired
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log('OAuth tokens need to be refreshed');
        throw new Error(`Your ${settings.provider.toUpperCase()} access has expired. Please reconnect your email provider.`);
      }
    }
    
    // Update the connection status
    await supabase
      .from('provider_connection_status')
      .upsert({
        user_id: user.id,
        provider: settings.provider,
        status: 'connected',
        last_check: new Date().toISOString(),
        error_message: null
      });
      
    // Update the last_validated timestamp
    await supabase
      .from('email_provider_credentials')
      .update({
        last_validated: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('provider', settings.provider);

    return {
      success: true,
      message: `Successfully connected to ${settings.provider.toUpperCase()}`,
      provider: settings.provider
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
}

// Helper function to refresh OAuth tokens
async function refreshOAuthTokens(provider: string, refreshToken: string) {
  console.log(`Refreshing OAuth tokens for ${provider}`);
  
  // In production, you would call the provider's token endpoint
  // For now, we'll simulate a token refresh
  
  // This is where you would implement the actual token refresh logic
  // For example, for Gmail:
  // 1. Call the Google OAuth token endpoint with the refresh token
  // 2. Get new access token and expiry
  // 3. Return the updated tokens
  
  // Simulated response
  return {
    access_token: `new_${provider}_access_token_${Date.now()}`,
    expiry_date: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
  };
}

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getProfile() {
  const userId = await getCurrentUserId();
  const user = await supabase.auth.getUser();
  const email = user.data.user?.email;

  // First try to get by ID
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && profile) {
    return profile as Profile;
  }

  // If no profile found, try to create one
  try {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        subscription_tier: 'free',
      })
      .select()
      .single();

    if (createError) {
      // If creation failed, try one more time to get the profile
      // (in case it was created by the trigger)
      const { data: retryProfile, error: retryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (retryError) throw retryError;
      return retryProfile as Profile;
    }

    return newProfile as Profile;
  } catch (error) {
    throw error;
  }
}

export async function updateProfile(profile: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', profile.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// Map email domains to providers
const EMAIL_DOMAIN_TO_PROVIDER = {
  'gmail.com': 'gmail',
  'googlemail.com': 'gmail',
  'outlook.com': 'outlook',
  'hotmail.com': 'outlook',
  'live.com': 'outlook',
  'msn.com': 'outlook',
  'yahoo.com': 'yahoo',
  'aol.com': 'aol',
  'protonmail.com': 'protonmail',
  'protonmail.ch': 'protonmail',
  'pm.me': 'protonmail',
  'zoho.com': 'zoho',
  'icloud.com': 'icloud',
  'me.com': 'icloud',
  'mac.com': 'icloud'
};

// Function to detect provider from email
function detectProviderFromEmail(email: string): string {
  if (!email) return 'gmail'; // Default to gmail if no email
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'gmail';
  
  // Map the domain to a supported provider or default to gmail
  const detectedProvider = EMAIL_DOMAIN_TO_PROVIDER[domain];
  
  // Only return providers that are supported in our EmailProvider type
  if (detectedProvider && ['gmail', 'outlook', 'yahoo', 'imap'].includes(detectedProvider)) {
    return detectedProvider;
  }
  
  // Default to gmail for unsupported providers
  return 'gmail';
}

export async function getEmailSettings() {
  const userId = await getCurrentUserId();
  
  // First check if we already have settings
  const { data: existingSettings } = await supabase
    .from('email_settings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingSettings && existingSettings.length > 0) {
    return existingSettings[0] as EmailSettings;
  }

  // No settings found, get user's email to detect provider
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email || '';
  
  // Detect provider from email
  const detectedProvider = detectProviderFromEmail(userEmail);
  console.log(`Detected provider ${detectedProvider} for email ${userEmail}`);

  // Create default settings with detected provider
  const { data: newSettings, error: createError } = await supabase
    .from('email_settings')
    .insert({
      user_id: userId,
      provider: detectedProvider,
      summary_time: '09:00',
      important_only: false,
    })
    .select()
    .single();

  if (createError) throw createError;
  return newSettings as EmailSettings;
}

export async function updateEmailSettings(updates: Partial<EmailSettings>) {
  try {
    console.log('Updating email settings:', updates);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('Not authenticated');
    }

    // If no ID is provided, check if settings exist
    if (!updates.id) {
      console.log('No settings ID provided, checking for existing settings');
      const { data: existingSettings, error: fetchError } = await supabase
        .from('email_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing settings:', fetchError);
        throw new Error(`Failed to check existing settings: ${fetchError.message}`);
      }

      if (existingSettings) {
        console.log('Found existing settings:', existingSettings.id);
        updates.id = existingSettings.id;
      }
    }

    // Prepare the update data
    const updateData = {
      ...updates,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (updates.id) {
      console.log('Updating existing settings with ID:', updates.id);
      // Update existing settings
      const { data, error } = await supabase
        .from('email_settings')
        .update(updateData)
        .eq('id', updates.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        throw new Error(`Failed to update settings: ${error.message}`);
      }

      result = data;
    } else {
      console.log('Creating new settings');
      // Create new settings
      const { data, error } = await supabase
        .from('email_settings')
        .insert(updateData)
        .select()
        .single();

      if (error) {
        console.error('Error creating settings:', error);
        throw new Error(`Failed to create settings: ${error.message}`);
      }

      result = data;
    }

    console.log('Settings updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to update email settings:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to update email settings'
    );
  }
}

export async function getEmailTemplate(name: string) {
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', name)
    .single();

  if (error) throw error;
  return template as EmailTemplate;
}

export async function sendEmail(templateName: string, to: string, variables: Record<string, string> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateName,
        to,
        variables,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send email');
  }

  return response.json();
}

export async function sendTestEmail() {
  try {
    console.log('Starting test email send');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get email settings
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      throw new Error('Failed to fetch email settings');
    }

    if (!settings?.provider) {
      throw new Error('Please connect your email provider first');
    }

    // Check for valid credentials
    const { data: credentials, error: credsError } = await supabase
      .from('email_provider_credentials')
      .select('credentials, is_valid')
      .eq('user_id', user.id)
      .eq('provider', settings.provider)
      .maybeSingle();

    if (credsError) {
      throw new Error('Failed to check email credentials');
    }

    if (!credentials || !credentials.is_valid) {
      throw new Error(`No valid ${settings.provider.toUpperCase()} credentials found. Please reconnect your email provider.`);
    }

    // Call the Edge Function to send the test email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'test',
        userId: user.id,
        provider: settings.provider
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error('Failed to send test email');
    }

    return {
      success: true,
      message: 'Test email sent successfully! Please check your inbox.'
    };
  } catch (error) {
    console.error('Send test email error:', error);
    throw error;
  }
}

export async function getEmailSummaries(date?: string) {
  const userId = await getCurrentUserId();
  const query = supabase
    .from('email_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (date) {
    query.eq('date', date);
  }

  const { data: summaries, error } = await query;

  if (error) throw error;
  return summaries as EmailSummary[];
}

export async function processEmails() {
  try {
    console.log('Starting email processing');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('Not authenticated');
    }

    console.log('Calling process-emails Edge Function');
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    ).catch(err => {
      console.error('Edge function fetch error:', err);
      throw new Error(`Failed to reach Edge Function: ${err.message}`);
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
      console.error('Edge function error response:', errorData);
      throw new Error(errorData.error || `Failed to process emails: HTTP ${response.status}`);
    }

    const data = await response.json().catch(err => {
      console.error('Error parsing response:', err);
      throw new Error('Failed to parse response from Edge Function');
    });

    console.log('Process emails response:', data);
    return data;
  } catch (error) {
    console.error('Failed to process emails:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process emails');
  }
}

export async function getEmailBatches() {
  const userId = await getCurrentUserId();
  
  const { data: batches, error } = await supabase
    .from('email_batches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return batches as EmailBatch[];
}

export async function getEmailBatch(batchId: string) {
  const userId = await getCurrentUserId();
  
  const { data: batch, error } = await supabase
    .from('email_batches')
    .select(`
      *,
      email_messages (*),
      email_summaries (*)
    `)
    .eq('id', batchId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return batch as EmailBatch & {
    email_messages: any[];
    email_summaries: any[];
  };
}

export async function connectGmail() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Please sign in to connect Gmail');
  }

  try {
    // Check for existing Gmail connection
    const { data: existingAuth, error: authError } = await supabase
      .from('gmail_auth')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (authError) {
      console.error('Error checking Gmail auth:', authError);
      throw new Error('Failed to check Gmail connection status');
    }

    // If already connected, return success
    if (existingAuth) {
      return {
        success: true,
        message: 'Gmail already connected',
      };
    }

    // Create development mode connection
    const { data: gmailAuth, error: insertError } = await supabase
      .from('gmail_auth')
      .insert({
        user_id: session.user.id,
        access_token: 'dev_mode_token',
        refresh_token: 'dev_mode_refresh',
        expiry_date: new Date(Date.now() + 3600000).toISOString(),
      }).select().single();

    if (insertError) {
      console.error('Error saving Gmail credentials:', insertError);
      throw new Error('Failed to save Gmail credentials. Please try again.');
    }

    // Update email provider settings
    await updateEmailSettings({
      id: undefined, // Let the function handle finding/creating settings
      provider: 'gmail',
    });

    return {
      success: true,
      message: 'Gmail connected successfully (Development Mode)',
    };
  } catch (error) {
    console.error('Gmail connection error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to connect Gmail account');
  }
}

export async function updateDeepSeekSettings(settings: {
  model: 'deepseek-chat',
  custom_prompt?: string,
  excluded_senders?: string[],
  exclude_promotions?: boolean,
  exclude_newsletters?: boolean,
  max_tokens?: number,
  temperature?: number
}) {
  const userId = await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('ai_settings')
    .upsert({
      user_id: userId,
      provider: 'deepseek',
      ...settings,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Keep for backward compatibility, but redirect to DeepSeek
export async function updateGPTSettings(settings: {
  model: string,
  custom_prompt?: string,
  excluded_senders?: string[],
  exclude_promotions?: boolean,
  exclude_newsletters?: boolean,
  max_tokens?: number,
  temperature?: number
}) {
  // Convert GPT model to DeepSeek model
  const deepseekSettings = {
    ...settings,
    model: 'deepseek-chat' as 'deepseek-chat', // Type assertion to fix TypeScript error
    provider: 'deepseek'
  };
  
  return updateDeepSeekSettings(deepseekSettings);
}

export async function disconnectEmailProvider() {
  try {
    console.log('Starting email provider disconnection');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get current settings to check if they exist
    const { data: currentSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError) {
      throw new Error('Failed to fetch current settings');
    }

    // Detect default provider from user's email
    const defaultProvider = detectProviderFromEmail(user.email || '');

    // First update email settings to set default provider
    const settingsData = {
      provider: defaultProvider, // Set default provider instead of null
      summary_time: currentSettings?.summary_time || '09:00',
      important_only: currentSettings?.important_only ?? false,
      user_id: user.id
    };

    if (currentSettings?.id) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('email_settings')
        .update(settingsData)
        .eq('id', currentSettings.id);

      if (updateError) {
        console.error('Failed to update settings:', updateError);
        throw new Error(`Failed to update email settings: ${updateError.message}`);
      }
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from('email_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to create settings:', insertError);
        throw new Error(`Failed to create email settings: ${insertError.message}`);
      }
    }

    // Delete provider connection status
    const { error: statusError } = await supabase
      .from('provider_connection_status')
      .delete()
      .eq('user_id', user.id);

    if (statusError) {
      console.error('Failed to delete connection status:', statusError);
    }

    // Delete provider credentials
    const { error: credsError } = await supabase
      .from('email_provider_credentials')
      .delete()
      .eq('user_id', user.id);

    if (credsError) {
      console.error('Failed to delete credentials:', credsError);
      throw new Error(`Failed to remove provider credentials: ${credsError.message}`);
    }

    // Log the disconnection
    await supabase
      .from('email_connection_logs')
      .insert({
        user_id: user.id,
        provider: currentSettings?.provider || defaultProvider,
        status: 'success',
        details: {
          action: 'disconnect',
          timestamp: new Date().toISOString(),
          previous_provider: currentSettings?.provider,
          new_provider: defaultProvider
        }
      });

    return {
      success: true,
      message: 'Email provider disconnected successfully'
    };
  } catch (error) {
    console.error('Failed to disconnect email provider:', error);
    
    // Log the failure
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('email_connection_logs')
        .insert({
          user_id: user.id,
          provider: 'unknown',
          status: 'error',
          details: {
            action: 'disconnect',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        });
    }
    
    throw error;
  }
}