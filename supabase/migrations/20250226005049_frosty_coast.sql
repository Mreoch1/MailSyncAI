/*
  # Add email sending functionality

  1. New Tables
    - `email_queue` table for tracking email sending status
    - Indexes for efficient querying
  
  2. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Create email queue table
CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  template_name text REFERENCES email_templates(name) NOT NULL,
  recipient text NOT NULL,
  variables jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  attempts int DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for users based on user_id"
  ON email_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id"
  ON email_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();