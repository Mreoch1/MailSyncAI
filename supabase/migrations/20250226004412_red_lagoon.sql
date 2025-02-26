/*
  # Add email templates and testing functionality

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `subject` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `email_templates` table
    - Add policies for authenticated users to read templates
*/

-- Create email templates table
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for reading templates
CREATE POLICY "Enable read access for authenticated users"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

-- Insert default templates
INSERT INTO email_templates (name, subject, content) VALUES
  ('welcome', 'Welcome to MailSyncAI! 👋', 
   'Hi there,

Thank you for joining MailSyncAI! We''re excited to help you get your inbox organized and stay on top of your important emails.

Here''s what you can do next:
1. Connect your email provider
2. Set up your notification preferences
3. Start receiving AI-powered email summaries

If you have any questions, feel free to reach out to our support team.

Best regards,
The MailSyncAI Team'),

  ('test_connection', 'MailSyncAI Connection Test ✉️',
   'Hi there,

This is a test email to confirm that your email connection is working properly with MailSyncAI.

If you''re receiving this message, it means:
✓ Your email provider is successfully connected
✓ Our system can send you notifications
✓ You''re ready to start receiving email summaries

No action is needed from your side. You''ll start receiving your personalized email summaries at your chosen time.

Best regards,
The MailSyncAI Team'),

  ('daily_summary', 'Your Daily Email Summary 📬',
   'Hi there,

Here''s your AI-powered summary of today''s emails:

Important (Requires Action):
{important_emails}

General Updates:
{general_updates}

Low Priority:
{low_priority}

View your full dashboard: {dashboard_url}

Best regards,
The MailSyncAI Team');

-- Create updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();