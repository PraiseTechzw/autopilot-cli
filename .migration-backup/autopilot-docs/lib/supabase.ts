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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey) {
    console.warn('⚠️ Supabase service credentials are missing. Using local leaderboard data instead.');
    return null;
  }

  cachedServiceClient = createClient(url, serviceKey);
  return cachedServiceClient;
}
