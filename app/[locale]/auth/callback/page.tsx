import {redirect} from 'next/navigation';
import {getServerSupabase} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';

type PageProps = {
  params: {locale: 'it' | 'en'};
  searchParams: {code?: string};
};

export default async function AuthCallbackPage({params: {locale}, searchParams}: PageProps) {
  const supabase = getServerSupabase();
  if (!supabase) {
    console.error('[auth/callback] Supabase client is unavailable during callback');
    redirect(`/${locale}/auth/sign-in?error=no_session`);
  }

  const code = searchParams.code;

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }

    const {
      data: {user},
      error: getUserError
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[auth/callback] No session after exchanging code', {
        locale,
        hasCode: Boolean(code),
        error: getUserError?.message
      });
      redirect(`/${locale}/auth/sign-in?error=no_session`);
    }

    await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email}});
  } catch (error) {
    console.error('[auth/callback] Failed to complete callback', error);
    redirect(`/${locale}/auth/sign-in?error=no_session`);
  }

  redirect(`/${locale}/app`);
}
