/*
  # Add Gmail Authentication Table

  1. New Tables
    - `gmail_auth`: Stores Gmail OAuth credentials
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `access_token` (text)
      - `refresh_token` (text)
      - `expiry_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add unique constraint on user_id

  3. Changes
    - Add indexes for performance
    - Check for existing trigger before creation
*/

-- Create Gmail auth table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'gmail_auth'
  ) THEN
    CREATE TABLE gmail_auth (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      access_token text NOT NULL,
      refresh_token text NOT NULL,
      expiry_date timestamptz NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT gmail_auth_user_id_key UNIQUE (user_id)
    );

    -- Enable RLS
    ALTER TABLE gmail_auth ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Enable read for users based on user_id"
      ON gmail_auth FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Enable insert for users based on user_id"
      ON gmail_auth FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Enable update for users based on user_id"
      ON gmail_auth FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_gmail_auth_user_id ON gmail_auth(user_id);
    CREATE INDEX IF NOT EXISTS idx_gmail_auth_created_at ON gmail_auth(created_at);
  END IF;
END $$;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_gmail_auth_updated_at'
  ) THEN
    CREATE TRIGGER update_gmail_auth_updated_at
      BEFORE UPDATE ON gmail_auth
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;