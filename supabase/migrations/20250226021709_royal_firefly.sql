/*
  # Fix Authentication and Database Issues

  1. Changes
    - Add missing RLS policies for processing logs
    - Fix unique constraint conflicts
    - Add proper error handling tables
    - Add provider connection status tracking

  2. Security
    - Enable RLS on all tables
    - Add proper policies for all operations
    - Ensure secure credential storage
*/

-- Create provider connection status table
CREATE TABLE IF NOT EXISTS provider_connection_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
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
CREATE INDEX idx_provider_status_check ON provider_connection_status(last_check);

-- Create trigger for status updates
CREATE TRIGGER update_provider_status_updated_at
    BEFORE UPDATE ON provider_connection_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix RLS policies for processing logs
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON email_processing_logs;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON email_processing_logs;

CREATE POLICY "Users can view their own processing logs"
  ON email_processing_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing logs"
  ON email_processing_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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
CREATE TRIGGER update_provider_status_on_connection
    AFTER INSERT OR UPDATE ON email_provider_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_status();

-- Create function to handle connection errors
CREATE OR REPLACE FUNCTION log_provider_error()
RETURNS trigger AS $$
BEGIN
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
    NEW.provider,
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
CREATE TRIGGER log_provider_error_on_failure
    AFTER INSERT ON email_processing_logs
    FOR EACH ROW
    WHEN (NEW.status = 'error')
    EXECUTE FUNCTION log_provider_error();

-- Update processing status function to handle errors
CREATE OR REPLACE FUNCTION update_processing_status()
RETURNS trigger AS $$
BEGIN
  INSERT INTO email_processing_status (
    user_id,
    provider,
    is_connected,
    last_sync
  )
  VALUES (
    NEW.user_id,
    NEW.provider,
    true,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    provider = EXCLUDED.provider,
    is_connected = true,
    last_sync = EXCLUDED.last_sync,
    last_error = null,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;