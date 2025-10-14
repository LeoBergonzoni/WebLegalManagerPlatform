import {redirect} from 'next/navigation';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';

type PageProps = {
  params: {locale: 'it' | 'en'};
  searchParams: {code?: string};
};

export default async function AuthCallbackPage({params: {locale}, searchParams}: PageProps) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    redirect(`/${locale}/auth/sign-in`);
    return null;
  }
  const code = searchParams.code;

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  try {
    const {
      data: {user}
    } = await supabase.auth.getUser();

    await ensureUserProfile({supabase, authUser: user});
  } catch {
    // ignore errors during callback handling; user will retry sign-in if needed
  }

  redirect(`/${locale}/app`);
}
