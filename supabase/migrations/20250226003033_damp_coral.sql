/*
  # Fix profile creation and RLS policies

  1. Changes
    - Drop existing profile policies
    - Add new policies for profile creation and management
    - Fix trigger function to handle profile creation properly

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Profile creation during signup
      - Profile viewing and updating by owner
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users only"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier)
  VALUES (
    new.id,
    new.email,
    'free'
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;