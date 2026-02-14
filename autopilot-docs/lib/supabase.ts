import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAnonClient: SupabaseClient | null = null;
let cachedServiceClient: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient {
  if (cachedAnonClient) return cachedAnonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  cachedAnonClient = createClient(url, key);
  return cachedAnonClient;
}

export function getServerClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const key = serviceKey || anonKey;
  cachedServiceClient = createClient(url, key);
  return cachedServiceClient;
}
