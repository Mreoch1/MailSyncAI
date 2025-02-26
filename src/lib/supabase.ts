import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please click the "Connect to Supabase" button in the top right corner to set up your project.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);