import {createClient} from '@supabase/supabase-js';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createTestServiceClient} from './testStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isTestMode = process.env.TEST_MODE === 'true';

export const isSupabaseServiceConfigured = isTestMode || Boolean(supabaseUrl && serviceRoleKey);

export function createServiceSupabaseClient(): SupabaseClient | null {
  if (isTestMode) {
    return createTestServiceClient() as unknown as SupabaseClient;
  }
  if (!isSupabaseServiceConfigured || !supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
