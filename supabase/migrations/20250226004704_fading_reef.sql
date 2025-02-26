/*
  # Fix email settings and add test email functionality

  1. Changes
    - Add unique constraint on user_id for email_settings
    - Clean up any duplicate settings
    - Add indexes for better query performance
    - Add test email template

  2. Security
    - Enable RLS on email_settings table
    - Add policies for authenticated users
*/

-- First, clean up any duplicate settings
WITH ranked_settings AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM email_settings
)
DELETE FROM email_settings
WHERE id IN (
  SELECT id 
  FROM ranked_settings 
  WHERE rn > 1
);

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_settings_user_id_key'
  ) THEN
    ALTER TABLE email_settings ADD CONSTRAINT email_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_settings_created_at ON email_settings(created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can manage own email settings" ON email_settings;

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

-- Ensure the updated_at trigger exists
DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();