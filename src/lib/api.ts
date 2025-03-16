import { supabase } from './supabase';
import type { Profile, EmailSettings, EmailSummary, EmailTemplate, EmailBatch } from '@/types/database';

export async function testConnection() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's email settings
  const { data: settings } = await supabase
    .from('email_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!settings) {
    throw new Error('Email provider not configured');
  }

  // Create a test batch
  const { error: batchError } = await supabase
    .from('email_batches')
    .insert({
      user_id: user.id,
      status: 'processing',
      total_emails: 1,
    })
    .select()
    .single();

  if (batchError) throw batchError;

  try {
    // Process test email
    const response = await processEmails();
    
    if (!response.success) {
      throw new Error('Email processing failed');
    }

    return {
      success: true,
      message: 'Test successful! Email processing is working correctly.',
      details: response,
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

  // No settings found, create default settings
  const { data: newSettings, error: createError } = await supabase
    .from('email_settings')
    .insert({
      user_id: userId,
      provider: 'gmail',
      summary_time: '09:00',
      important_only: false,
    })
    .select()
    .single();

  if (createError) throw createError;
  return newSettings as EmailSettings;
}

export async function updateEmailSettings(settings: Partial<EmailSettings>) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('email_settings')
    .upsert({
      user_id: userId,
      ...settings,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmailSettings;
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error('User email not found');
  }

  try {
    // Use Supabase's built-in email functionality
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    
    if (error) throw error;

    return {
      success: true,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    console.error('Failed to send test email:', error);
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process emails');
    }

    return response.json();
  } catch (error) {
    console.error('Failed to process emails:', error);
    throw error;
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