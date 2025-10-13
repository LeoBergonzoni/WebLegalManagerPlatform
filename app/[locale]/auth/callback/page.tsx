import {createServerSupabaseClient} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';

type PageProps = {
  params: {locale: 'it' | 'en'};
  searchParams: {code?: string};
};

export default async function AuthCallbackPage({params: {locale}, searchParams}: PageProps) {
  const supabase = createServerSupabaseClient();
  const code = searchParams.code;

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  try {
    const {
      data: {user}
    } = await supabase.auth.getUser();

    if (user?.id && user.email) {
      await supabase
        .from('users')
        .upsert(
          {
            auth_user_id: user.id,
            email: user.email
          },
          {onConflict: 'auth_user_id'}
        );
    }
  } catch {
    // ignore errors during callback handling; user will retry sign-in if needed
  }

  redirect(`/${locale}/app`);
}
