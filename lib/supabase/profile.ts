'use server';

import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';

export type AppProfile = {
  id: string;
  auth_user_id: string;
  email: string;
  name: string | null;
  plan: string | null;
  billing_status: string | null;
  stripe_customer_id: string | null;
};

export async function getSupabaseServer() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value
      }
    }
  );
  return supabase;
}

/** Returns current profile or null; NEVER throws */
export async function getCurrentProfile(): Promise<AppProfile | null> {
  const supabase = await getSupabaseServer();

  const {
    data: {user},
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr || !user) return null;

  const {data, error} = await supabase
    .from('users')
    .select('id, auth_user_id, email, name, plan, billing_status, stripe_customer_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return data as AppProfile;
}
