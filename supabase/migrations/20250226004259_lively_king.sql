/*
  # Fix email settings duplicates

  1. Changes
    - Add unique constraint on user_id to prevent multiple settings per user
    - Clean up any duplicate settings by keeping only the most recent one
    - Add trigger to update updated_at timestamp

  2. Security
    - Maintain existing RLS policies
*/

-- First, clean up any duplicate settings by keeping only the most recent one
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

-- Add unique constraint on user_id
ALTER TABLE email_settings
ADD CONSTRAINT email_settings_user_id_key UNIQUE (user_id);

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();