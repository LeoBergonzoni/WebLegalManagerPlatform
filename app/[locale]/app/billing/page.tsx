import Link from 'next/link';
import {createServerSupabaseClient, isSupabaseConfigured} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-dynamic';

export default async function BillingPlaceholder({params: {locale}}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 text-sm text-[#cfd3da] shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        Configure Supabase to manage billing preferences.
      </div>
    );
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  await ensureUserProfile({supabase, authUser: user});

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Billing &amp; plan</h1>
        <p className="mt-3 text-sm text-[#cfd3da]">
          Billing integrations are coming soon. In the meantime, reach out to your Web Legal Manager representative to
          update or review your plan.
        </p>
        <Link
          href={`/${locale}/app`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
