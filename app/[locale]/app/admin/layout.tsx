import type {ReactNode} from 'react';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerClient} from '@supabase/ssr';

type AdminLayoutProps = {
  children: ReactNode;
  params: {locale: 'it' | 'en'};
};

type AdminProfileRow = {
  is_admin: boolean | null;
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({children, params: {locale}}: AdminLayoutProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return children;
  }

  const cookieStore = cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in?next=/${locale}/app/admin/users`);
  }

  const {data, error} = await supabase
    .from('users')
    .select('is_admin')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  const profile = data as AdminProfileRow | null;

  if (error || !profile?.is_admin) {
    redirect(`/${locale}/app`);
  }

  return children;
}
