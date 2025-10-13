import {cookies} from 'next/headers';
import {createServerClient, type CookieOptions} from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function ensureConfigs() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  return {supabaseUrl, supabaseAnonKey};
}

export function createServerSupabaseClient() {
  const {supabaseUrl, supabaseAnonKey} = ensureConfigs();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(_name: string, _value: string, _options: CookieOptions) {
        // The cookie store is read-only in server components;
        // mutations should be handled via server actions or route handlers.
      },
      remove(_name: string, _options: CookieOptions) {
        // No-op (see comment above).
      }
    }
  });
}
