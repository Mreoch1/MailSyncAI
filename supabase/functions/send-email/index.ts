import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateEmailRequest {
  templateName: string;
  to: string;
  variables?: Record<string, string>;
}

interface DirectEmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

type EmailRequest = TemplateEmailRequest | DirectEmailRequest;

function isTemplateRequest(req: EmailRequest): req is TemplateEmailRequest {
  return 'templateName' in req;
}

function isDirectRequest(req: EmailRequest): req is DirectEmailRequest {
  return 'subject' in req;
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

    // Get request data
    const requestData = await req.json() as EmailRequest;
    const to = requestData.to;
    
    let subject = '';
    let content = '';
    
    // Handle different email request types
    if (isTemplateRequest(requestData)) {
      // Template-based email
      const { templateName, variables = {} } = requestData;
      
      // Get email template
      const { data: template, error: templateError } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .single();

      if (templateError || !template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Replace variables in template
      subject = template.subject;
      content = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(`{${key}}`, value);
      });

      // Create email queue entry
      const { error: queueError } = await supabaseClient
        .from('email_queue')
        .insert({
          user_id: user.id,
          template_name: templateName,
          recipient: to,
          variables,
        });

      if (queueError) {
        console.error('Failed to queue email:', queueError);
        // Continue anyway - don't fail the whole request
      }
    } else if (isDirectRequest(requestData)) {
      // Direct email with subject and content
      subject = requestData.subject;
      content = requestData.html || requestData.text || '';
      
      // Log direct email in queue for tracking
      const { error: queueError } = await supabaseClient
        .from('email_queue')
        .insert({
          user_id: user.id,
          template_name: 'direct_email',
          recipient: to,
          variables: { subject, content: requestData.text || '' },
          metadata: { is_test: true }
        });

      if (queueError) {
        console.error('Failed to log direct email:', queueError);
        // Continue anyway - don't fail the whole request
      }
    } else {
      throw new Error('Invalid email request format');
    }

    // Configure SMTP client
    const client = new SmtpClient();
    
    console.log('Connecting to SMTP server:', {
      hostname: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      username: Deno.env.get('SMTP_USERNAME'),
    });
    
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOST') ?? '',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      username: Deno.env.get('SMTP_USERNAME') ?? '',
      password: Deno.env.get('SMTP_PASSWORD') ?? '',
    });

    // Send email
    const fromEmail = Deno.env.get('SMTP_FROM') ?? 'noreply@mailsyncai.com';
    console.log(`Sending email from ${fromEmail} to ${to} with subject "${subject}"`);
    
    await client.send({
      from: fromEmail,
      to,
      subject,
      content,
      html: isDirectRequest(requestData) && requestData.html ? requestData.html : undefined,
    });

    await client.close();

    // Update queue status if it was a template email
    if (isTemplateRequest(requestData)) {
      await supabaseClient
        .from('email_queue')
        .update({ status: 'sent' })
        .eq('template_name', requestData.templateName)
        .eq('recipient', to)
        .eq('status', 'pending');
    } else {
      // Update direct email status
      await supabaseClient
        .from('email_queue')
        .update({ status: 'sent' })
        .eq('template_name', 'direct_email')
        .eq('recipient', to)
        .eq('status', 'pending');
    }

    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${to}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Email sending error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});