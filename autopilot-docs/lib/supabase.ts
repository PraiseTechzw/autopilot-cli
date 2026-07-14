import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAnonClient: SupabaseClient | null = null;
let cachedServiceClient: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient {
  if (cachedAnonClient) return cachedAnonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    throw new Error('Supabase anon client is not configured');
  }
  cachedAnonClient = createClient(url, key);
  return cachedAnonClient;
}

export function getServerClient(): SupabaseClient | null {
  if (cachedServiceClient) return cachedServiceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || (!serviceKey && !anonKey)) {
    console.warn('⚠️ Supabase environment variables are missing. Using local leaderboard data instead.');
    return null;
  }

  if (!serviceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to ANON_KEY. Some operations may fail due to RLS.');
  }

  const key = serviceKey || anonKey;
  cachedServiceClient = createClient(url, key);
  return cachedServiceClient;
}
