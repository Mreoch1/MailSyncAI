/*
  # Add email settings policies

  This migration adds policies for the email_settings table if they don't already exist.
  It uses DO blocks to safely check for existing policies before creating them.

  1. Security
    - Add policies for authenticated users to:
      - View their own email settings
      - Update their own email settings
      - Insert their own email settings
    - Add trigger for updating timestamps
*/

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'email_settings' 
        AND policyname = 'Users can view own email settings'
    ) THEN
        CREATE POLICY "Users can view own email settings"
            ON email_settings FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'email_settings' 
        AND policyname = 'Users can update own email settings'
    ) THEN
        CREATE POLICY "Users can update own email settings"
            ON email_settings FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'email_settings' 
        AND policyname = 'Users can insert own email settings'
    ) THEN
        CREATE POLICY "Users can insert own email settings"
            ON email_settings FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Create or replace the timestamp update function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();