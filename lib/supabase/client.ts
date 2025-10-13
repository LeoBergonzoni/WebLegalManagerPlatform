import {createBrowserClient} from '@supabase/ssr';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createTestBrowserClient} from './testStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isTestMode = process.env.TEST_MODE === 'true';

export const supabaseBrowserClient = (): SupabaseClient | null => {
  if (isTestMode) {
    return createTestBrowserClient() as unknown as SupabaseClient;
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
