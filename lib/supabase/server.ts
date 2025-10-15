import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createTestServerClient} from './testStore';
import {assertEnvOrThrow, isSupabaseConfigured, isTestMode} from '@/lib/env';

export function getServerSupabase(): SupabaseClient | null {
  const cookieStore = cookies();

  if (isTestMode) {
    return createTestServerClient(() => cookieStore.get('test-auth')?.value) as unknown as SupabaseClient;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const {supabaseUrl, supabaseAnon} = assertEnvOrThrow();

  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({name, value, ...options});
      },
      remove(name, options) {
        cookieStore.set({name, value: '', ...options, maxAge: 0});
      }
    }
  });
}

export {isSupabaseConfigured, isTestMode} from '@/lib/env';
