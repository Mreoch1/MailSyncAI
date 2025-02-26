/*
  # Add IMAP settings support

  1. Changes
    - Add IMAP settings column to email_settings table
    - Update existing policies

  2. Security
    - Maintain RLS policies
    - Ensure IMAP credentials are properly stored
*/

-- Add IMAP settings column if it doesn't exist
ALTER TABLE email_settings
ADD COLUMN IF NOT EXISTS imap_settings jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_email_settings_provider ON email_settings(provider);

-- Update or create policies
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON email_settings;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON email_settings;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON email_settings;

CREATE POLICY "Enable read for users based on user_id"
  ON email_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id"
  ON email_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON email_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);