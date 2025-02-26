import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  templateName: string;
  to: string;
  variables?: Record<string, string>;
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
    const { templateName, to, variables = {} } = await req.json() as EmailRequest;

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
    let content = template.content;
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
      throw new Error('Failed to queue email');
    }

    // Configure SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOST') ?? '',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      username: Deno.env.get('SMTP_USERNAME') ?? '',
      password: Deno.env.get('SMTP_PASSWORD') ?? '',
    });

    // Send email
    await client.send({
      from: Deno.env.get('SMTP_FROM') ?? 'noreply@mailsyncai.com',
      to,
      subject: template.subject,
      content,
    });

    await client.close();

    // Update queue status
    await supabaseClient
      .from('email_queue')
      .update({ status: 'sent' })
      .eq('template_name', templateName)
      .eq('recipient', to)
      .eq('status', 'pending');

    return new Response(
      JSON.stringify({ success: true }),
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