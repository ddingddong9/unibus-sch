import { createClient } from 'jsr:@supabase/supabase-js@2';

export const getSupabase = () => {
  // DB_URL / DB_SERVICE_KEY: custom env vars for local dev (loaded via --env-file)
  // SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: injected automatically in production
  const url = Deno.env.get('DB_URL') || Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('DB_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return createClient(url, key);
};

export const db = getSupabase();
