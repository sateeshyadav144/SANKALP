import { createClient } from '@supabase/supabase-js';

const getEnvOrStorage = (envKey: string, storageKey: string): string => {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  }
  return (import.meta.env[envKey] as string) || '';
};

export const supabaseUrl = getEnvOrStorage('VITE_SUPABASE_URL', 'sankalp_supabase_url');
export const supabaseAnonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'sankalp_supabase_anon_key');

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
