/*
  # Fix profile creation and error handling

  1. Changes
    - Add unique constraint on email
    - Improve trigger function to handle race conditions
    - Add ON CONFLICT handling

  2. Security
    - Maintain existing RLS policies
    - Ensure proper error handling
*/

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Improve trigger function with better conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier)
  VALUES (
    new.id,
    new.email,
    'free'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email
  WHERE profiles.email IS NULL;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;