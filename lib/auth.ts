import {isSupabaseServiceConfigured, createServiceSupabaseClient} from '@/lib/supabase/service';

type UserRow = {
  is_admin: boolean | null;
};

export async function isAdmin(authUserId: string | null | undefined): Promise<boolean> {
  if (!authUserId || !isSupabaseServiceConfigured) {
    return false;
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return false;
  }

  const {data, error} = await supabase.from('users').select('is_admin').eq('auth_user_id', authUserId).maybeSingle();

  if (error) {
    return false;
  }

  const row = (data ?? null) as UserRow | null;
  return Boolean(row?.is_admin);
}
