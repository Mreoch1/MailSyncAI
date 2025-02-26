/*
  # Add Gmail OAuth and Email Processing Tables

  1. New Tables
    - `gmail_auth`: Stores Gmail OAuth tokens
    - `email_processing_queue`: Tracks emails to be processed
    - `email_summaries`: Stores GPT-generated summaries
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Gmail OAuth tokens
CREATE TABLE gmail_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT gmail_auth_user_id_key UNIQUE (user_id)
);

-- Email processing queue
CREATE TABLE email_processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  message_id text NOT NULL,
  subject text,
  from_email text,
  received_at timestamptz NOT NULL,
  processed boolean DEFAULT false,
  processing_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- GPT processing settings
CREATE TABLE gpt_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  model text DEFAULT 'gpt-3.5-turbo' NOT NULL,
  max_tokens integer DEFAULT 500,
  temperature numeric DEFAULT 0.7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT gpt_settings_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE gmail_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own Gmail auth"
  ON gmail_auth FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their email queue"
  ON email_processing_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their GPT settings"
  ON gpt_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_email_queue_user_id ON email_processing_queue(user_id);
CREATE INDEX idx_email_queue_processed ON email_processing_queue(processed);
CREATE INDEX idx_gmail_auth_user_id ON gmail_auth(user_id);

-- Update triggers
CREATE TRIGGER update_gmail_auth_updated_at
    BEFORE UPDATE ON gmail_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gpt_settings_updated_at
    BEFORE UPDATE ON gpt_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();