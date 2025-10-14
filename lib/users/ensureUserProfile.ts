import type {SupabaseClient, User} from '@supabase/supabase-js';

export type UserProfileRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  name: string | null;
  created_at?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

type EnsureUserProfileParams = {
  supabase: SupabaseClient;
  authUser: User | null | undefined;
};

/**
 * Ensures that the authenticated user has a corresponding row in public.users.
 * Returns the existing or newly created row, or null when it cannot be retrieved.
 */
export async function ensureUserProfile({
  supabase,
  authUser
}: EnsureUserProfileParams): Promise<UserProfileRow | null> {
  if (!supabase || !authUser?.id) {
    return null;
  }

  const {data: existing, error: existingError} = await supabase
    .from('users')
    .select('id, auth_user_id, email, name, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('auth_user_id', authUser.id)
    .returns<UserProfileRow[]>()
    .maybeSingle();

  if (existing) {
    return existing;
  }

  if (existingError && existingError.code !== 'PGRST116') {
    return null;
  }

  if (!authUser.email) {
    return null;
  }

  const payload = {
    auth_user_id: authUser.id,
    email: authUser.email,
    name: (authUser.user_metadata?.full_name as string | null) ?? null
  };

  const {error: upsertError} = await supabase.from('users').upsert(payload, {onConflict: 'auth_user_id'});

  if (upsertError) {
    return null;
  }

  const {data: created, error: fetchError} = await supabase
    .from('users')
    .select('id, auth_user_id, email, name, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('auth_user_id', authUser.id)
    .returns<UserProfileRow[]>()
    .single();

  if (fetchError) {
    return null;
  }

  return created;
}
