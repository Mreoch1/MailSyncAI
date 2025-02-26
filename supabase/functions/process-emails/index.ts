import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { google } from 'https://deno.land/x/google_auth@v1.0.0/mod.ts';
import { ImapFlow } from 'https://esm.sh/imapflow@1.0.148';
import { Client } from 'https://deno.land/x/microsoft_graph@v1.0.0/mod.ts';
import { format } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailContent {
  messageId: string;
  threadId?: string;
  subject: string;
  sender: string;
  body: string;
  date: Date;
  labels: string[];
}

interface ProcessedEmail {
  category: string;
  importance: 'high' | 'medium' | 'low';
  summary: string;
  action_items: string[];
  meeting_details?: {
    date: string;
    time: string;
    duration: string;
    attendees: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    // Create new batch
    const { data: batch, error: batchError } = await supabaseClient
      .from('email_batches')
      .insert({
        user_id: user.id,
        status: 'processing',
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Log batch creation
    await supabaseClient
      .from('email_processing_logs')
      .insert({
        user_id: user.id,
        batch_id: batch.id,
        event_type: 'batch_started',
        status: 'success',
        details: { batch_id: batch.id },
      });

    // Get user's email provider credentials
    const { data: credentials, error: credsError } = await supabaseClient
      .from('email_provider_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true)
      .single();

    if (credsError || !credentials) {
      throw new Error('Email provider not configured or invalid credentials');
    }

    // Get user's processing rules
    const { data: userRules } = await supabaseClient
      .from('email_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    // Get emails based on provider
    let emails: EmailContent[] = [];
    const startTime = new Date();
    
    try {
      if (credentials.provider === 'gmail') {
        emails = await fetchGmailEmails(credentials.credentials, batch.id, supabaseClient);
      } else if (credentials.provider === 'outlook') {
        emails = await fetchOutlookEmails(credentials.credentials, batch.id, supabaseClient);
      } else if (credentials.provider === 'imap') {
        emails = await fetchIMAPEmails(credentials.credentials, batch.id, supabaseClient);
      }

      // Log successful fetch
      await supabaseClient
        .from('email_processing_logs')
        .insert({
          user_id: user.id,
          batch_id: batch.id,
          event_type: 'emails_fetched',
          status: 'success',
          details: { count: emails.length },
          duration: new Date().getTime() - startTime.getTime(),
        });
    } catch (error) {
      // Log fetch error
      await supabaseClient
        .from('email_processing_logs')
        .insert({
          user_id: user.id,
          batch_id: batch.id,
          event_type: 'emails_fetched',
          status: 'error',
          error: error.message,
          duration: new Date().getTime() - startTime.getTime(),
        });
      throw error;
    }

    // Store raw emails
    for (const email of emails) {
      await supabaseClient
        .from('email_messages')
        .insert({
          user_id: user.id,
          batch_id: batch.id,
          message_id: email.messageId,
          thread_id: email.threadId,
          subject: email.subject,
          sender: email.sender,
          recipient: user.email,
          received_date: email.date,
          content_preview: email.body.substring(0, 200),
          raw_content: email.body,
          labels: email.labels,
        });
    }

    // Update batch with total
    await supabaseClient
      .from('email_batches')
      .update({ total_emails: emails.length })
      .eq('id', batch.id);

    // Get GPT settings
    const { data: gptSettings } = await supabaseClient
      .from('gpt_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Process emails with GPT
    const processedEmails: ProcessedEmail[] = [];
    let errorCount = 0;

    for (const email of emails) {
      const processingStart = new Date();
      try {
        const processed = await processEmailWithGPT(
          email,
          userRules || [],
          gptSettings?.model || 'gpt-3.5-turbo'
        );
        processedEmails.push(processed);

        // Log successful processing
        await supabaseClient
          .from('email_processing_logs')
          .insert({
            user_id: user.id,
            batch_id: batch.id,
            message_id: email.messageId,
            event_type: 'email_processed',
            status: 'success',
            details: processed,
            duration: new Date().getTime() - processingStart.getTime(),
          });

        // Update processed count
        await supabaseClient
          .from('email_batches')
          .update({ processed_emails: processedEmails.length })
          .eq('id', batch.id);
      } catch (error) {
        console.error(`Error processing email: ${error}`);
        errorCount++;

        // Log processing error
        await supabaseClient
          .from('email_processing_logs')
          .insert({
            user_id: user.id,
            batch_id: batch.id,
            message_id: email.messageId,
            event_type: 'email_processed',
            status: 'error',
            error: error.message,
            duration: new Date().getTime() - processingStart.getTime(),
          });
      }
    }

    // Group emails by category
    const categorizedEmails = processedEmails.reduce((acc, email) => {
      const category = email.category.toLowerCase();
      if (!acc[category]) acc[category] = [];
      acc[category].push(email);
      return acc;
    }, {} as Record<string, ProcessedEmail[]>);

    // Create summary
    const summary = {
      important_emails: categorizedEmails['urgent'] || [],
      action_required: categorizedEmails['action_required'] || [],
      meetings: processedEmails.filter(e => e.meeting_details),
      general_updates: categorizedEmails['important'] || [],
      low_priority: categorizedEmails['newsletter']?.concat(
        categorizedEmails['promotional'] || []
      ) || [],
    };

    // Save summary
    const { error: summaryError } = await supabaseClient
      .from('email_summaries')
      .insert({
        user_id: user.id,
        batch_id: batch.id,
        content: summary,
        categories: Object.keys(categorizedEmails),
        action_items: processedEmails
          .filter(e => e.action_items.length > 0)
          .flatMap(e => e.action_items),
        meetings: processedEmails
          .filter(e => e.meeting_details)
          .map(e => e.meeting_details),
        stats: {
          total: emails.length,
          processed: processedEmails.length,
          errors: errorCount,
          categories: Object.fromEntries(
            Object.entries(categorizedEmails).map(([k, v]) => [k, v.length])
          ),
        },
      });

    if (summaryError) throw summaryError;

    // Update batch status
    await supabaseClient
      .from('email_batches')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        error_count: errorCount,
      })
      .eq('id', batch.id);

    // Send summary email
    await sendSummaryEmail(user.id, summary, batch.id, supabaseClient);

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batch.id,
        summary: {
          total_emails: emails.length,
          processed: processedEmails.length,
          errors: errorCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function fetchGmailEmails(
  credentials: any,
  batchId: string,
  supabase: any
): Promise<EmailContent[]> {
  // Initialize Gmail API
  const gmail = google.gmail({ version: 'v1', auth: {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  }});

  // Get recent messages
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 50,
    q: 'newer_than:1d',
  });

  const emails: EmailContent[] = [];

  for (const message of response.data.messages || []) {
    const details = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full',
    });

    const headers = details.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value || '';
    const from = headers?.find(h => h.name === 'From')?.value || '';
    const date = headers?.find(h => h.name === 'Date')?.value || '';

    const body = details.data.payload?.parts
      ?.find(part => part.mimeType === 'text/plain')
      ?.body?.data || '';

    emails.push({
      messageId: message.id,
      threadId: message.threadId,
      subject,
      sender: from,
      body: atob(body.replace(/-/g, '+').replace(/_/g, '/')),
      date: new Date(date),
      labels: details.data.labelIds || [],
    });
  }

  return emails;
}

async function fetchOutlookEmails(
  credentials: any,
  batchId: string,
  supabase: any
): Promise<EmailContent[]> {
  // Initialize Microsoft Graph client
  const client = Client.init({
    authProvider: (done) => {
      done(null, credentials.access_token);
    },
  });

  // Get recent messages
  const response = await client.api('/me/messages')
    .select('id,subject,from,body,receivedDateTime,categories')
    .filter("receivedDateTime ge " + 
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .orderby('receivedDateTime desc')
    .top(50)
    .get();

  return response.value.map((message: any) => ({
    messageId: message.id,
    threadId: message.conversationId,
    subject: message.subject,
    sender: message.from.emailAddress.address,
    body: message.body.content,
    date: new Date(message.receivedDateTime),
    labels: message.categories || [],
  }));
}

async function fetchIMAPEmails(
  credentials: any,
  batchId: string,
  supabase: any
): Promise<EmailContent[]> {
  // Decrypt password
  const { data: { password }, error: decryptError } = await supabase.rpc(
    'decrypt_secret',
    { encrypted_secret: credentials.password }
  );

  if (decryptError) throw decryptError;

  // Initialize IMAP client
  const client = new ImapFlow({
    host: credentials.host,
    port: credentials.port,
    secure: credentials.use_ssl,
    auth: {
      user: credentials.username,
      pass: password,
    },
  });

  const emails: EmailContent[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Search for recent messages
      const messages = await client.fetch(
        'SINCE ' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        { source: true, envelope: true, flags: true }
      );

      for await (const message of messages) {
        emails.push({
          messageId: message.uid.toString(),
          subject: message.envelope.subject,
          sender: message.envelope.from[0].address,
          body: message.source.toString(),
          date: message.envelope.date,
          labels: message.flags || [],
        });
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    console.error('IMAP error:', error);
    throw error;
  }

  return emails;
}
async function processEmailWithGPT(
  email: EmailContent,
  userRules: any[],
  model: string
): Promise<ProcessedEmail> {
  const prompt = `
    Analyze this email and provide:
    1. Category (urgent/important/action_required/meeting/follow_up/newsletter/social/promotional)
    2. Importance level (high/medium/low)
    3. Brief summary
    4. Action items (if any)
    5. Meeting details (if applicable)

    Subject: ${email.subject}
    From: ${email.sender}
    Body: ${email.body}

    User Rules:
    ${userRules.map(rule => 
      `- If ${JSON.stringify(rule.conditions)}, then ${JSON.stringify(rule.actions)}`
    ).join('\n')}
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert email analyzer. Analyze emails and extract key information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to process email with GPT');
  }

  const result = await response.json();
  const analysis = result.choices[0].message.content;

  // Parse GPT response and extract information
  const category = analysis.match(/Category:\s*(\w+)/i)?.[1] || 'general';
  const importance = analysis.match(/Importance:\s*(\w+)/i)?.[1] || 'medium';
  const summary = analysis.match(/Summary:\s*(.+?)(?=\n|$)/i)?.[1] || '';
  const actionItems = analysis.match(/Action items:(.*?)(?=\n|$)/i)?.[1]?.split(',').map(i => i.trim()) || [];
  
  const meetingMatch = email.body.match(/meeting.*?(\d{1,2}:\d{2})/i);
  const meetingDetails = meetingMatch ? {
    date: format(new Date(), 'yyyy-MM-dd'),
    time: meetingMatch[1],
    duration: '1 hour',
    attendees: [],
  } : undefined;

  return {
    category,
    importance: importance as 'high' | 'medium' | 'low',
    summary,
    action_items: actionItems,
    meeting_details: meetingDetails,
  };
}

async function sendSummaryEmail(
  userId: string,
  summary: any,
  batchId: string,
  supabase: any
) {
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user?.email) return;

  // Get user's custom template if exists
  const { data: customTemplate } = await supabase
    .from('email_templates_custom')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'daily_summary')
    .eq('is_active', true)
    .single();

  // Fall back to default template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', 'daily_summary')
    .single();

  if (!template && !customTemplate) return;

  const selectedTemplate = customTemplate || template;

  // Replace variables in template
  let content = selectedTemplate.content
    .replace('{important_emails}', formatEmailList(summary.important_emails))
    .replace('{action_required}', formatEmailList(summary.action_required))
    .replace('{general_updates}', formatEmailList(summary.general_updates))
    .replace('{meetings}', formatMeetingList(summary.meetings));

  // Send email using Edge Function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: user.email,
      subject: selectedTemplate.subject,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send summary email');
  }

  // Log email sent
  await supabase
    .from('email_processing_logs')
    .insert({
      user_id: userId,
      batch_id: batchId,
      event_type: 'summary_email_sent',
      status: 'success',
      details: { template: selectedTemplate.name },
    });
}

function formatEmailList(emails: ProcessedEmail[]): string {
  return emails
    .map(email => `• ${email.subject}: ${email.summary}`)
    .join('\n');
}

function formatMeetingList(meetings: any[]): string {
  return meetings
    .map(meeting => `• ${meeting.subject} at ${meeting.time}`)
    .join('\n');
}