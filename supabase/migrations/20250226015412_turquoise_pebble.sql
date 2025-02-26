/*
  # Email Processing Schema Update

  1. Changes
    - Safe table creation with existence checks
    - Add email processing tables if not exist
    - Add indexes and policies
    - Insert default categories
    - Add triggers

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
*/

-- Safely create tables with existence checks
DO $$ 
BEGIN
  -- Create email batches table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_batches') THEN
    CREATE TABLE email_batches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      start_time timestamptz NOT NULL DEFAULT now(),
      end_time timestamptz,
      status text NOT NULL DEFAULT 'pending',
      total_emails integer DEFAULT 0,
      processed_emails integer DEFAULT 0,
      error_count integer DEFAULT 0,
      error_details jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE email_batches ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY "Users can view their own email batches"
      ON email_batches FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    -- Create index
    CREATE INDEX idx_email_batches_user_status ON email_batches(user_id, status);
  END IF;

  -- Create email messages table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_messages') THEN
    CREATE TABLE email_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      batch_id uuid REFERENCES email_batches ON DELETE CASCADE,
      message_id text NOT NULL,
      thread_id text,
      subject text,
      sender text NOT NULL,
      recipient text NOT NULL,
      received_date timestamptz NOT NULL,
      content_preview text,
      raw_content text,
      labels jsonb DEFAULT '[]',
      metadata jsonb DEFAULT '{}',
      processing_status text DEFAULT 'pending',
      processing_error text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY "Users can view their own email messages"
      ON email_messages FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    -- Create index
    CREATE INDEX idx_email_messages_user_status ON email_messages(user_id, processing_status);
  END IF;

  -- Create email categories table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_categories') THEN
    CREATE TABLE email_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      priority integer DEFAULT 0,
      color text,
      icon text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE (name)
    );

    -- Insert default categories
    INSERT INTO email_categories (name, description, priority, color, icon) VALUES
      ('urgent', 'Time-sensitive matters requiring immediate attention', 1, 'red', 'alert-circle'),
      ('important', 'High-priority items needing attention soon', 2, 'orange', 'alert-triangle'),
      ('action_required', 'Emails requiring specific actions or responses', 3, 'blue', 'check-circle'),
      ('meeting', 'Calendar invites and meeting-related emails', 4, 'purple', 'calendar'),
      ('follow_up', 'Items to follow up on later', 5, 'yellow', 'clock'),
      ('newsletter', 'Subscriptions and newsletters', 6, 'green', 'mail'),
      ('social', 'Social media notifications', 7, 'pink', 'users'),
      ('promotional', 'Marketing and promotional content', 8, 'gray', 'tag');
  END IF;

  -- Create user email rules table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_rules') THEN
    CREATE TABLE email_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      name text NOT NULL,
      description text,
      conditions jsonb NOT NULL,
      actions jsonb NOT NULL,
      is_active boolean DEFAULT true,
      priority integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY "Users can manage their own email rules"
      ON email_rules FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    -- Create index
    CREATE INDEX idx_email_rules_user_active ON email_rules(user_id, is_active);
  END IF;
END $$;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_email_batches_updated_at'
  ) THEN
    CREATE TRIGGER update_email_batches_updated_at
      BEFORE UPDATE ON email_batches
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_email_messages_updated_at'
  ) THEN
    CREATE TRIGGER update_email_messages_updated_at
      BEFORE UPDATE ON email_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_email_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_email_rules_updated_at
      BEFORE UPDATE ON email_rules
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;