/*
  # Email Provider Connections

  1. New Tables
    - `oauth_connections`: Stores OAuth tokens for Gmail, Outlook, and Yahoo
    - `imap_connections`: Stores IMAP connection details
    - `email_connection_logs`: Tracks connection attempts and status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure storage of sensitive credentials
*/

-- Create OAuth connections table
CREATE TABLE oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'yahoo')),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry_date timestamptz NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Create IMAP connections table
CREATE TABLE imap_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  server text NOT NULL,
  port integer NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  use_ssl boolean DEFAULT true,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, server, username)
);

-- Create connection logs table
CREATE TABLE email_connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  error text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imap_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connection_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for oauth_connections
CREATE POLICY "Users can manage their own OAuth connections"
  ON oauth_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for imap_connections
CREATE POLICY "Users can manage their own IMAP connections"
  ON imap_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for connection logs
CREATE POLICY "Users can view their own connection logs"
  ON email_connection_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connection logs"
  ON email_connection_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_oauth_connections_user_provider ON oauth_connections(user_id, provider);
CREATE INDEX idx_imap_connections_user ON imap_connections(user_id);
CREATE INDEX idx_connection_logs_user ON email_connection_logs(user_id);
CREATE INDEX idx_connection_logs_created_at ON email_connection_logs(created_at);

-- Create updated_at triggers
CREATE TRIGGER update_oauth_connections_updated_at
    BEFORE UPDATE ON oauth_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imap_connections_updated_at
    BEFORE UPDATE ON imap_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();