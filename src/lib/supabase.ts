import { createClient } from '@supabase/supabase-js';

const getEnvOrStorage = (envVal: string | undefined, storageKey: string): string => {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  }
  return envVal || '';
};

// Direct static access ensures Vite replaces environment variables at build time
export const supabaseUrl = getEnvOrStorage(import.meta.env.VITE_SUPABASE_URL, 'sankalp_supabase_url');
export const supabaseAnonKey = getEnvOrStorage(import.meta.env.VITE_SUPABASE_ANON_KEY, 'sankalp_supabase_anon_key');

// Detect if valid Supabase credentials have been configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseUrl.startsWith('https://')
);

// Create Supabase client with anon key
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
