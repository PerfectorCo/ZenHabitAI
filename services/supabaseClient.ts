import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env as any).SUPABASE_URL;
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Failed to initialize Supabase auth client:', e);
  }
} else {
  console.warn('Supabase auth client not initialized. Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
}

export { supabase };
