/*
  # Add Outlook and IMAP Support

  1. New Tables
    - `outlook_auth` for storing Outlook OAuth tokens
    - `imap_auth` for storing IMAP credentials (encrypted)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access
    - Encrypt sensitive IMAP credentials

  3. Changes
    - Add indexes for performance
    - Add validation triggers
*/

-- Create Outlook auth table
CREATE TABLE outlook_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry_date timestamptz NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT outlook_auth_user_id_key UNIQUE (user_id)
);

-- Create IMAP auth table with encrypted credentials
CREATE TABLE imap_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  host text NOT NULL,
  port integer NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  use_ssl boolean DEFAULT true,
  email text NOT NULL,
  is_valid boolean DEFAULT true,
  last_validated timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT imap_auth_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE outlook_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE imap_auth ENABLE ROW LEVEL SECURITY;

-- Create policies for Outlook auth
CREATE POLICY "Users can manage their own Outlook auth"
  ON outlook_auth FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for IMAP auth
CREATE POLICY "Users can manage their own IMAP auth"
  ON imap_auth FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_outlook_auth_user_id ON outlook_auth(user_id);
CREATE INDEX idx_outlook_auth_email ON outlook_auth(email);
CREATE INDEX idx_imap_auth_user_id ON imap_auth(user_id);
CREATE INDEX idx_imap_auth_email ON imap_auth(email);

-- Create updated_at triggers
CREATE TRIGGER update_outlook_auth_updated_at
    BEFORE UPDATE ON outlook_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imap_auth_updated_at
    BEFORE UPDATE ON imap_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to encrypt IMAP password
CREATE OR REPLACE FUNCTION encrypt_imap_password()
RETURNS trigger AS $$
BEGIN
  -- Only encrypt if password changed
  IF TG_OP = 'INSERT' OR NEW.password != OLD.password THEN
    NEW.password = encrypt_secret(NEW.password);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to encrypt IMAP password
CREATE TRIGGER encrypt_imap_password_before_save
    BEFORE INSERT OR UPDATE ON imap_auth
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_imap_password();

-- Create function to validate IMAP credentials
CREATE OR REPLACE FUNCTION validate_imap_credentials()
RETURNS trigger AS $$
BEGIN
  -- Set last_validated timestamp
  NEW.last_validated = now();
  
  -- Basic validation
  NEW.is_valid = (
    NEW.host IS NOT NULL AND
    NEW.port > 0 AND
    NEW.username IS NOT NULL AND
    NEW.password IS NOT NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for IMAP validation
CREATE TRIGGER validate_imap_credentials_before_save
    BEFORE INSERT OR UPDATE ON imap_auth
    FOR EACH ROW
    EXECUTE FUNCTION validate_imap_credentials();