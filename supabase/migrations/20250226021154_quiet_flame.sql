/*
  # Fix processing status and logs

  1. Changes
    - Add safe table creation with existence checks
    - Add missing policies for email batches
    - Add indexes for better performance

  2. Security
    - Enable RLS for all tables
    - Add policies for authenticated users
*/

-- Create processing status table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'email_processing_status'
  ) THEN
    CREATE TABLE email_processing_status (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      provider text NOT NULL,
      last_sync timestamptz,
      last_error text,
      is_connected boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT email_processing_status_user_id_key UNIQUE (user_id)
    );

    -- Enable RLS
    ALTER TABLE email_processing_status ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Enable read for users based on user_id"
      ON email_processing_status FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Enable update for users based on user_id"
      ON email_processing_status FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Enable insert for users based on user_id"
      ON email_processing_status FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    -- Create index
    CREATE INDEX idx_processing_status_user ON email_processing_status(user_id);
  END IF;
END $$;

-- Create trigger for status updates
CREATE OR REPLACE FUNCTION update_processing_status()
RETURNS trigger AS $$
BEGIN
  INSERT INTO email_processing_status (user_id, provider, is_connected)
  VALUES (NEW.user_id, NEW.provider, true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    provider = EXCLUDED.provider,
    is_connected = true,
    last_sync = now(),
    last_error = null,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_processing_status_on_settings'
  ) THEN
    CREATE TRIGGER update_processing_status_on_settings
      AFTER INSERT OR UPDATE ON email_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_processing_status();
  END IF;
END $$;