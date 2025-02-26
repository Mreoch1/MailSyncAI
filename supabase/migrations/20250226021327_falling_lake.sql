/*
  # Add email processing error tracking

  1. New Tables
    - email_processing_errors: Track detailed error information
    - Add policies and indexes for performance
    - Add function for error logging

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create email processing errors table
CREATE TABLE IF NOT EXISTS email_processing_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  batch_id uuid REFERENCES email_batches ON DELETE CASCADE,
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_details jsonb DEFAULT '{}',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_processing_errors ENABLE ROW LEVEL SECURITY;

-- Create policies for email processing errors
CREATE POLICY "Enable read for users based on user_id"
  ON email_processing_errors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id"
  ON email_processing_errors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_processing_errors_user ON email_processing_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_errors_batch ON email_processing_errors(batch_id);
CREATE INDEX IF NOT EXISTS idx_processing_errors_type ON email_processing_errors(error_type);

-- Create updated_at trigger
CREATE TRIGGER update_processing_errors_updated_at
    BEFORE UPDATE ON email_processing_errors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();