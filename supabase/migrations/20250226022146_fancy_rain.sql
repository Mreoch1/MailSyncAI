/*
  # Provider Connection Status Table

  1. New Tables
    - `provider_connection_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `provider` (text)
      - `status` (text)
      - `last_check` (timestamptz)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add indexes for performance

  3. Changes
    - Drop existing table if exists to ensure clean state
    - Create new table with proper constraints
    - Add RLS policies
    - Add indexes
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS provider_connection_status CASCADE;

-- Create provider connection status table
CREATE TABLE provider_connection_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('connecting', 'connected', 'error', 'disconnected')),
  last_check timestamptz DEFAULT now(),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT provider_connection_status_user_provider_key UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE provider_connection_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for users based on user_id"
  ON provider_connection_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id"
  ON provider_connection_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON provider_connection_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_provider_status_user ON provider_connection_status(user_id);
CREATE INDEX idx_provider_status_provider ON provider_connection_status(provider);
CREATE INDEX idx_provider_status_check ON provider_connection_status(last_check);

-- Create updated_at trigger
CREATE TRIGGER update_provider_status_updated_at
    BEFORE UPDATE ON provider_connection_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update provider status
CREATE OR REPLACE FUNCTION update_provider_status()
RETURNS trigger AS $$
BEGIN
  INSERT INTO provider_connection_status (
    user_id,
    provider,
    status,
    last_check
  )
  VALUES (
    NEW.user_id,
    NEW.provider,
    CASE 
      WHEN NEW.is_valid THEN 'connected'
      ELSE 'error'
    END,
    now()
  )
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_check = EXCLUDED.last_check,
    error_message = NULL,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for provider status updates
DROP TRIGGER IF EXISTS update_provider_status_on_connection ON email_provider_credentials;
CREATE TRIGGER update_provider_status_on_connection
    AFTER INSERT OR UPDATE ON email_provider_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_status();

-- Create function to handle connection errors
CREATE OR REPLACE FUNCTION log_provider_error()
RETURNS trigger AS $$
BEGIN
  -- Only process error events related to provider connections
  IF NEW.event_type NOT LIKE '%provider%' THEN
    RETURN NEW;
  END IF;

  -- Update provider status
  INSERT INTO provider_connection_status (
    user_id,
    provider,
    status,
    error_message,
    last_check
  )
  VALUES (
    NEW.user_id,
    NEW.details->>'provider',
    'error',
    NEW.error,
    now()
  )
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    status = 'error',
    error_message = EXCLUDED.error_message,
    last_check = EXCLUDED.last_check,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for error logging
DROP TRIGGER IF EXISTS log_provider_error_on_failure ON email_processing_logs;
CREATE TRIGGER log_provider_error_on_failure
    AFTER INSERT ON email_processing_logs
    FOR EACH ROW
    WHEN (NEW.status = 'error')
    EXECUTE FUNCTION log_provider_error();