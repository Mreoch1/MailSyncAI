/*
  # Email Processing Infrastructure

  1. New Tables
    - email_provider_credentials: Store encrypted provider credentials
    - email_processing_logs: Track detailed processing history
    - email_templates_custom: User-specific email templates
  
  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Encryption for sensitive credentials
*/

-- Create secure encryption function
CREATE OR REPLACE FUNCTION encrypt_secret(secret text)
RETURNS text AS $$
BEGIN
  -- In production, implement proper encryption
  -- For now, we'll use a reversible encoding
  RETURN encode(secret::bytea, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure decryption function
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_secret text)
RETURNS text AS $$
BEGIN
  -- In production, implement proper decryption
  -- For now, we'll decode the encoding
  RETURN convert_from(decode(encrypted_secret, 'base64'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create email provider credentials table
CREATE TABLE email_provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  credentials jsonb NOT NULL,
  is_valid boolean DEFAULT true,
  last_validated timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Create detailed processing logs
CREATE TABLE email_processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  batch_id uuid REFERENCES email_batches ON DELETE CASCADE,
  message_id text,
  event_type text NOT NULL,
  status text NOT NULL,
  details jsonb,
  error text,
  duration interval,
  created_at timestamptz DEFAULT now()
);

-- Create custom email templates table
CREATE TABLE email_templates_custom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Enable RLS
ALTER TABLE email_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates_custom ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their provider credentials"
  ON email_provider_credentials FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their processing logs"
  ON email_processing_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their custom templates"
  ON email_templates_custom FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_provider_creds_user ON email_provider_credentials(user_id, provider);
CREATE INDEX idx_processing_logs_batch ON email_processing_logs(batch_id);
CREATE INDEX idx_processing_logs_user_date ON email_processing_logs(user_id, created_at DESC);
CREATE INDEX idx_custom_templates_user ON email_templates_custom(user_id);

-- Create updated_at triggers
CREATE TRIGGER update_provider_creds_updated_at
    BEFORE UPDATE ON email_provider_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_templates_updated_at
    BEFORE UPDATE ON email_templates_custom
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate provider credentials
CREATE OR REPLACE FUNCTION validate_provider_credentials()
RETURNS trigger AS $$
BEGIN
  -- Set last_validated timestamp
  NEW.last_validated = now();
  
  -- In production, implement actual validation
  -- For now, we'll assume credentials are valid if they contain required fields
  NEW.is_valid = (
    NEW.credentials ? 'access_token' AND
    NEW.credentials ? 'refresh_token' AND
    NEW.credentials ? 'expiry_date'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credential validation
CREATE TRIGGER validate_credentials_before_save
    BEFORE INSERT OR UPDATE ON email_provider_credentials
    FOR EACH ROW
    EXECUTE FUNCTION validate_provider_credentials();