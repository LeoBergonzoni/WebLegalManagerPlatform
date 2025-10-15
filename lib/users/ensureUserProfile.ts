import type {SupabaseClient} from '@supabase/supabase-js';

export type UserProfileRow = {
  id: string;
  email: string;
  name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export async function ensureUserProfile({
  supabase,
  authUser
}: {
  supabase: SupabaseClient;
  authUser: {id: string; email: string | null};
}): Promise<UserProfileRow | null> {
  if (!supabase || !authUser?.id) {
    return null;
  }

  const {data: existing} = await supabase
    .from('users')
    .select('id, email, name, stripe_customer_id, stripe_subscription_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (existing) {
    return existing as UserProfileRow;
  }

  const {data: created, error} = await supabase
    .from('users')
    .insert({
      auth_user_id: authUser.id,
      email: authUser.email ?? ''
    })
    .select('id, email, name, stripe_customer_id, stripe_subscription_id')
    .single();

  if (error || !created) {
    return null;
  }

  return created as UserProfileRow;
}
