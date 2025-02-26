/*
  # Add email batches policies

  1. Changes
    - Add policy to allow users to create their own email batches
    - Add policy to allow users to update their own email batches
    - Add policy to allow users to read their own email batches

  2. Security
    - Enable RLS for email batches table
    - Restrict access to only authenticated users
    - Users can only access their own batches
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email batches" ON email_batches;

-- Create comprehensive policies
CREATE POLICY "Enable insert for users based on user_id"
  ON email_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users based on user_id"
  ON email_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON email_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_batches_user_created 
  ON email_batches(user_id, created_at DESC);