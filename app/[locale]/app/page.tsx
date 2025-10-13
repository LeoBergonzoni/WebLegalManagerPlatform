import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {createServerSupabaseClient, isSupabaseConfigured} from '@/lib/supabase/server';

type Params = {
  params: {locale: 'it' | 'en'};
};

export function generateStaticParams() {
  return [{locale: 'it'}, {locale: 'en'}];
}

export const dynamic = 'force-dynamic';

export default async function AppDashboardPlaceholder({params: {locale}}: Params) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-wlm flex-col px-6 py-10 text-wlm-text">
        <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-8">
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-4 text-sm text-[#cfd3da]">
            Supabase environment variables are missing. Add{' '}
            <code className="rounded bg-[#1f2125] px-1 py-0.5 text-xs text-[var(--wlm-yellow)]">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{' '}
            and{' '}
            <code className="rounded bg-[#1f2125] px-1 py-0.5 text-xs text-[var(--wlm-yellow)]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{' '}
            to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    redirect(`/${locale}/auth/sign-in`);
  }

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

  const {data: profile} = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', userId)
    .single();

  let identityStatus: 'missing' | 'uploaded' | 'verified' = 'missing';

  if (profile?.id) {
    const {data: identities} = await supabase
      .from('identities')
      .select('id, verified_at, created_at')
      .eq('user_id', profile.id)
      .order('created_at', {ascending: false})
      .limit(1);

    const identity = identities?.[0];
    if (identity) {
      identityStatus = identity.verified_at ? 'verified' : 'uploaded';
    }
  }

  const t = await getTranslations({locale});

  return (
    <div className="mx-auto flex min-h-screen max-w-wlm flex-col px-6 py-10 text-wlm-text">
      <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-8 space-y-6">
        {identityStatus === 'missing' ? (
          <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-[#fce9b2]">
            <span className="font-semibold text-[var(--wlm-yellow)]">
              Complete your identity check to speed up contract preparation.
            </span>{' '}
            <Link
              href={`/${locale}/app/identity`}
              className="text-[var(--wlm-yellow)] underline hover:text-[#ffd600]"
            >
              Upload your document now.
            </Link>
          </div>
        ) : null}
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
