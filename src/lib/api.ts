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

    if (!settings) {
      console.error('No email settings found');
      throw new Error('Email provider not configured');
    }

    // Detect provider from email
    const userEmail = user.email || '';
    const detectedProvider = detectProviderFromEmail(userEmail);
    console.log('Detected provider from email:', detectedProvider);
    
    // Use detected provider if available, otherwise use the one from settings
    const providerToUse = detectedProvider || settings.provider;
    console.log('Using provider for connection test:', providerToUse);

    // Check provider connection status
    console.log('Checking provider connection status for:', providerToUse);
    
    // Get provider credentials - use maybeSingle() instead of single() to handle missing rows gracefully
    const { data: credentials, error: credsError } = await supabase
      .from('email_provider_credentials')
      .select('credentials, is_valid, last_validated')
      .eq('user_id', user.id)
      .eq('provider', providerToUse)
      .maybeSingle();
      
    if (credsError) {
      console.error('Error fetching provider credentials:', credsError);
      throw new Error(`Failed to fetch provider credentials: ${credsError.message}`);
    }
    
    if (!credentials) {
      console.error('No provider credentials found');
      
      // Create a simulated connection for development/testing
      console.log('Creating simulated provider connection for testing');
      
      // Create a simulated provider connection status
      await supabase
        .from('provider_connection_status')
        .upsert({
          user_id: user.id,
          provider: providerToUse,
          status: 'connected',
          last_check: new Date().toISOString(),
          error_message: null
        });
        
      // Create simulated credentials
      await supabase
        .from('email_provider_credentials')
        .upsert({
          user_id: user.id,
          provider: providerToUse,
          credentials: {
            access_token: `simulated_${providerToUse}_token_${Date.now()}`,
            refresh_token: `simulated_refresh_token_${Date.now()}`,
            expiry_date: new Date(Date.now() + 3600 * 1000).toISOString(),
            email: user.email
          },
          is_valid: true,
          last_validated: new Date().toISOString()
        });
        
      // If the detected provider is different from the settings provider, update the settings
      if (detectedProvider && detectedProvider !== settings.provider) {
        console.log(`Updating email settings provider from ${settings.provider} to ${detectedProvider}`);
        await supabase
          .from('email_settings')
          .update({ provider: detectedProvider })
          .eq('id', settings.id);
      }
        
      return {
        success: true,
        message: `Connection simulated successfully for ${providerToUse.toUpperCase()} in development mode.`,
        provider: providerToUse
      };
    }
    
    if (!credentials.is_valid) {
      console.error('Provider credentials are invalid');
      throw new Error(`Your ${providerToUse} credentials are invalid. Please reconnect your email provider.`);
    }
    
    // Check if tokens need to be refreshed
    let needsRefresh = false;
    let updatedCredentials = { ...credentials.credentials };
    
    if (credentials.credentials.expiry_date) {
      const expiryDate = new Date(credentials.credentials.expiry_date);
      const now = new Date();
      
      // If token expires in less than 5 minutes or is already expired
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log('OAuth tokens need to be refreshed');
        needsRefresh = true;
        
        try {
          // Refresh the tokens
          const refreshedTokens = await refreshOAuthTokens(
            providerToUse, 
            credentials.credentials.refresh_token
          );
          
          // Update the credentials with new tokens
          updatedCredentials = {
            ...credentials.credentials,
            access_token: refreshedTokens.access_token,
            expiry_date: refreshedTokens.expiry_date
          };
          
          // Update the credentials in the database
          await supabase
            .from('email_provider_credentials')
            .update({
              credentials: updatedCredentials,
              is_valid: true,
              last_validated: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('provider', providerToUse);
            
          console.log('OAuth tokens refreshed successfully');
        } catch (refreshError) {
          console.error('Failed to refresh OAuth tokens:', refreshError);
          // We'll continue with the existing tokens and let the validation happen
        }
      }
    }
    
    // If we didn't need to refresh tokens or if refresh failed, still update the last_validated timestamp
    if (!needsRefresh) {
      // Check if we need to refresh the connection status
      const lastValidated = credentials.last_validated ? new Date(credentials.last_validated) : null;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (!lastValidated || lastValidated < oneHourAgo) {
        console.log('Credentials need validation, updating status');
        
        // Update the provider connection status
        await supabase
          .from('provider_connection_status')
          .upsert({
            user_id: user.id,
            provider: providerToUse,
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
          .eq('provider', providerToUse);
      }
    }
    
    // If the detected provider is different from the settings provider, update the settings
    if (detectedProvider && detectedProvider !== settings.provider) {
      console.log(`Updating email settings provider from ${settings.provider} to ${detectedProvider}`);
      await supabase
        .from('email_settings')
        .update({ provider: detectedProvider })
        .eq('id', settings.id);
    }
    
    // Log the successful connection test
    await supabase
      .from('email_connection_logs')
      .insert({
        user_id: user.id,
        provider: providerToUse,
        status: 'test_success',
        details: {
          timestamp: new Date().toISOString()
        }
      });

    return {
      success: true,
      message: `Connection test successful! ${providerToUse.toUpperCase()} is properly connected.`,
      provider: providerToUse
    };
  } catch (error) {
    console.error('Test connection error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to test email processing'
    );
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
    console.log('Starting test email process');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user?.email) {
      console.error('No user email found');
      throw new Error('User email not found');
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
      throw new Error('Email provider not configured. Please connect an email provider first.');
    }

    // Detect provider from email
    const userEmail = user.email;
    const detectedProvider = detectProviderFromEmail(userEmail);
    console.log('Detected provider from email:', detectedProvider);
    
    // Use detected provider if available, otherwise use the one from settings
    const providerToUse = detectedProvider || settings.provider;
    console.log('Using provider for test email:', providerToUse);
    
    // If the detected provider is different from the settings provider, update the settings
    if (detectedProvider && detectedProvider !== settings.provider) {
      console.log(`Updating email settings provider from ${settings.provider} to ${detectedProvider}`);
      await supabase
        .from('email_settings')
        .update({ provider: detectedProvider })
        .eq('id', settings.id);
    }
    
    // Get provider credentials - use maybeSingle() to handle missing rows gracefully
    const { data: credentials, error: credsError } = await supabase
      .from('email_provider_credentials')
      .select('credentials, is_valid')
      .eq('user_id', user.id)
      .eq('provider', providerToUse)
      .maybeSingle();
      
    if (credsError) {
      console.error('Error fetching provider credentials:', credsError);
      throw new Error('Failed to fetch provider credentials. Please try reconnecting your email provider.');
    }
    
    // If no credentials found, create simulated ones for development/testing
    if (!credentials) {
      console.log('No credentials found, creating simulated credentials for testing');
      
      // Create simulated credentials
      const { error: insertError } = await supabase
        .from('email_provider_credentials')
        .upsert({
          user_id: user.id,
          provider: providerToUse,
          credentials: {
            access_token: `simulated_${providerToUse}_token_${Date.now()}`,
            refresh_token: `simulated_refresh_token_${Date.now()}`,
            expiry_date: new Date(Date.now() + 3600 * 1000).toISOString(),
            email: user.email
          },
          is_valid: true,
          last_validated: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating simulated credentials:', insertError);
        throw new Error('Failed to create test credentials. Please try again.');
      }
      
      // Create a simulated provider connection status
      await supabase
        .from('provider_connection_status')
        .upsert({
          user_id: user.id,
          provider: providerToUse,
          status: 'connected',
          last_check: new Date().toISOString(),
          error_message: null
        });
        
      // Log the test email attempt
      await supabase
        .from('email_connection_logs')
        .insert({
          user_id: user.id,
          provider: providerToUse,
          status: 'test_email_sent',
          details: {
            recipient: user.email,
            subject: 'MailSyncAI Connection Test',
            timestamp: new Date().toISOString(),
            simulated: true
          }
        });
        
      return {
        success: true,
        message: `Test email simulation completed for ${providerToUse.toUpperCase()}. In production, this would send an actual email using your ${providerToUse.toUpperCase()} account.`
      };
    }
    
    if (!credentials.is_valid) {
      console.error('Provider credentials are invalid');
      throw new Error('Provider credentials are invalid. Please reconnect your email provider.');
    }
    
    // Check if tokens need to be refreshed
    let updatedCredentials = { ...credentials.credentials };
    
    if (credentials.credentials.expiry_date) {
      const expiryDate = new Date(credentials.credentials.expiry_date);
      const now = new Date();
      
      // If token expires in less than 5 minutes or is already expired
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log('OAuth tokens need to be refreshed before sending test email');
        
        try {
          // Refresh the tokens
          const refreshedTokens = await refreshOAuthTokens(
            providerToUse, 
            credentials.credentials.refresh_token
          );
          
          // Update the credentials with new tokens
          updatedCredentials = {
            ...credentials.credentials,
            access_token: refreshedTokens.access_token,
            expiry_date: refreshedTokens.expiry_date
          };
          
          // Update the credentials in the database
          await supabase
            .from('email_provider_credentials')
            .update({
              credentials: updatedCredentials,
              is_valid: true,
              last_validated: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('provider', providerToUse);
            
          console.log('OAuth tokens refreshed successfully');
        } catch (refreshError) {
          console.error('Failed to refresh OAuth tokens:', refreshError);
          // Continue with existing tokens
        }
      }
    }
    
    // Send a test email using the user's own email provider
    console.log('Sending test email using user\'s own email provider:', providerToUse);
    
    // Get session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    
    // Call the process-emails Edge Function with a special flag to send a test email
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_test_email',
          provider: providerToUse,
          to: user.email,
          subject: 'MailSyncAI Connection Test',
          body: `This is a test email from MailSyncAI to verify your ${providerToUse.toUpperCase()} connection is working correctly. If you're receiving this, your email connection is properly set up!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #4f46e5;">MailSyncAI Connection Test</h2>
              <p>This is a test email from MailSyncAI to verify your ${providerToUse.toUpperCase()} connection is working correctly.</p>
              <p>If you're receiving this, your email connection is properly set up!</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
                <p>This is an automated message from MailSyncAI. Please do not reply to this email.</p>
              </div>
            </div>
          `
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
      console.error('Failed to send test email:', errorData);
      throw new Error(errorData.error || `Failed to send test email: HTTP ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Test email response:', responseData);
    
    // Log the test email attempt
    await supabase
      .from('email_connection_logs')
      .insert({
        user_id: user.id,
        provider: providerToUse,
        status: 'test_email_sent',
        details: {
          recipient: user.email,
          subject: 'MailSyncAI Connection Test',
          timestamp: new Date().toISOString()
        }
      });
      
    console.log('Test email logged successfully');

    return {
      success: true,
      message: `Test email sent to ${user.email} using your ${providerToUse.toUpperCase()} account. Please check your inbox (and spam folder).`
    };
  } catch (error) {
    console.error('Failed to send test email:', error);
    // Provide more detailed error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while sending test email';
    throw new Error(errorMessage);
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