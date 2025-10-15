const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const testMode = process.env.TEST_MODE === 'true';

export function assertEnvOrThrow() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return {
    supabaseUrl,
    supabaseAnon: supabaseAnonKey
  };
}

export const isSupabaseConfigured = testMode || (Boolean(supabaseUrl) && Boolean(supabaseAnonKey));
export const isTestMode = testMode;
