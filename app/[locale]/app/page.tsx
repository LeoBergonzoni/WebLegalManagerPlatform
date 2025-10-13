import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {createServerSupabaseClient} from '@/lib/supabase/server';

type Params = {
  params: {locale: 'it' | 'en'};
};

export function generateStaticParams() {
  return [{locale: 'it'}, {locale: 'en'}];
}

export default async function AppDashboardPlaceholder({params: {locale}}: Params) {
  const supabase = createServerSupabaseClient();
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userName: string | null = null;

  try {
    const {
      data: {user}
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      userEmail = user.email ?? null;
      userName = (user.user_metadata?.full_name as string | null) ?? null;
    }
  } catch {
    userId = null;
  }

  if (!userId) {
    redirect(`/${locale}/auth/sign-in`);
  }

  if (userId && userEmail) {
    await supabase
      .from('users')
      .upsert(
        {
          auth_user_id: userId,
          email: userEmail,
          name: userName
        },
        {onConflict: 'auth_user_id'}
      );
  }

  const t = await getTranslations({locale});

  return (
    <div className="mx-auto flex min-h-screen max-w-wlm flex-col px-6 py-10 text-wlm-text">
      <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-8">
        <h1 className="text-3xl font-extrabold">{t('app_title')}</h1>
        <p className="mt-4 text-base text-[#cfd3da]">{t('app_intro')}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-wlm-yellow px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-wlm-yellow-strong"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}
