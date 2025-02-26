/*
  # Initial Schema for MailSyncAI

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `subscription_tier` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `email_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `provider` (text)
      - `summary_time` (time)
      - `important_only` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `email_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `important_emails` (jsonb)
      - `general_updates` (jsonb)
      - `low_priority` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read and update their own profile
      - Read and manage their email settings
      - Read their email summaries

  3. Functions
    - Automatically create profile on user signup
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_settings table
CREATE TABLE email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  summary_time time DEFAULT '09:00',
  important_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_summaries table
CREATE TABLE email_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  important_emails jsonb DEFAULT '[]',
  general_updates jsonb DEFAULT '[]',
  low_priority jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own email settings"
  ON email_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own email settings"
  ON email_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email summaries"
  ON email_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();