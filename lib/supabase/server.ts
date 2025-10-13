import {cookies} from 'next/headers';
import {createServerClient, type CookieOptions} from '@supabase/ssr';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createTestServerClient} from './testStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isTestMode = process.env.TEST_MODE === 'true';

export const isSupabaseConfigured = isTestMode || Boolean(supabaseUrl && supabaseAnonKey);

export function createServerSupabaseClient(): SupabaseClient | null {
  const cookieStore = cookies();

  if (isTestMode) {
    return createTestServerClient(() => cookieStore.get('test-auth')?.value) as unknown as SupabaseClient;
  }
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(_name: string, _value: string, _options: CookieOptions) {},
      remove(_name: string, _options: CookieOptions) {}
    }
  });
}
