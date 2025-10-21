import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server';

type RequireAdminResult = {
  supabase: SupabaseClient | null;
  user: User | null;
};

export async function requireAdminOrRedirect(locale: string): Promise<RequireAdminResult> {
  if (!isSupabaseConfigured) {
    // When Supabase is not configured we allow the page to render its own warning.
    return { supabase: null, user: null };
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    redirect(`/${locale}/auth/sign-in?next=/${locale}/app/admin/users`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in?next=/${locale}/app/admin/users`);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect(`/${locale}/app`);
  return { supabase, user };
}
