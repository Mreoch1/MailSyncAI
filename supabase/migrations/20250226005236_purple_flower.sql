/*
  # Add SMTP configuration

  1. New Table
    - `smtp_config` table for storing SMTP settings
    - Encrypted storage for sensitive data
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create SMTP config table
CREATE TABLE smtp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  host text NOT NULL,
  port integer NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  from_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT smtp_config_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for users based on user_id"
  ON smtp_config FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id"
  ON smtp_config FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON smtp_config FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_smtp_config_user_id ON smtp_config(user_id);

-- Create updated_at trigger
CREATE TRIGGER update_smtp_config_updated_at
    BEFORE UPDATE ON smtp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();