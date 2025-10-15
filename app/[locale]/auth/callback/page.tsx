import {redirect} from 'next/navigation';
import {getServerSupabase} from '@/lib/supabase/server';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export default async function AuthCallbackPage({params: {locale}}: PageProps) {
  const supabase = getServerSupabase();
  if (!supabase) {
    redirect(`/${locale}/auth/sign-in?error=no_session`);
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${locale}/app`);
  }

  redirect(`/${locale}/auth/sign-in?error=no_session`);
}
