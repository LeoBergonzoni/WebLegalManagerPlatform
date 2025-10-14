import {Suspense} from 'react';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createServerSupabaseClient, isSupabaseConfigured} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';
import CopyLinkButton from '@/components/CopyLinkButton';

type Params = {
  params: {locale: 'it' | 'en'};
};

const statusStyles: Record<string, string> = {
  Found: 'bg-slate-500/15 text-slate-100 border border-slate-500/30',
  Pending: 'bg-amber-500/15 text-amber-100 border border-amber-500/30',
  Submitted: 'bg-blue-500/20 text-blue-100 border border-blue-500/30',
  Removed: 'bg-emerald-500/15 text-emerald-100 border border-emerald-500/30',
  Rejected: 'bg-red-500/15 text-red-100 border border-red-500/30'
};

export function generateStaticParams() {
  return [{locale: 'it'}, {locale: 'en'}];
}

export const dynamic = 'force-dynamic';

export default async function AppDashboardPage({params: {locale}}: Params) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
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

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const profile = await ensureUserProfile({supabase, authUser: user});
  if (!profile) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-4 text-sm text-[#cfd3da]">
            We couldn&apos;t prepare your account profile. Please refresh the page or contact support if the issue
            persists.
          </p>
        </div>
      </div>
    );
  }

  const {data: identityRow} = await supabase
    .from('identities')
    .select('id, verified_at, created_at')
    .eq('user_id', profile.id)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();

  const hasIdentity = Boolean(identityRow?.id);
  const isIdentityVerified = Boolean(identityRow?.verified_at);

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-[#8d939f]">Welcome back</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--wlm-text)]">
              {profile.name?.trim() || user.email || 'Your dashboard'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#cfd3da]">
              Track flagged content, follow the takedown process, and keep your brand safe. Everything you need lives in
              this workspace.
            </p>
          </div>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-full border border-[#2a2b2f] px-4 py-2 text-sm font-semibold text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
          >
            ← Back to site
          </Link>
        </div>

        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection profileId={profile.id} />
        </Suspense>
      </section>

      {!hasIdentity ? (
        <section className="rounded-[20px] border border-amber-500/25 bg-amber-500/10 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.25)]">
          <h2 className="text-lg font-semibold text-[var(--wlm-text)]">Finish your identity check</h2>
          <p className="mt-2 text-sm text-[#fce9b2]">
            Upload a government-issued document so our legal team can produce paperwork on your behalf.
          </p>
          <Link
            href={`/${locale}/app/identity`}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
          >
            Upload identity document
          </Link>
        </section>
      ) : !isIdentityVerified ? (
        <section className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.25)]">
          <h2 className="text-lg font-semibold text-[var(--wlm-text)]">Identity under review</h2>
          <p className="mt-2 text-sm text-[#cfd3da]">
            Your document is being reviewed. We&apos;ll notify you as soon as it&apos;s verified so takedowns can be
            accelerated.
          </p>
          <Link
            href={`/${locale}/app/identity`}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-[#2a2b2f] px-4 py-2 text-sm font-semibold text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
          >
            View identity status
          </Link>
        </section>
      ) : null}

      <section className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--wlm-text)]">Latest findings</h2>
            <p className="text-sm text-[#9aa0a6]">The ten most recent items across all sources.</p>
          </div>
          <Link
            href={`/${locale}/app/findings`}
            className="inline-flex items-center justify-center rounded-full border border-[#2a2b2f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
          >
            View all
          </Link>
        </div>

        <Suspense fallback={<LatestFindingsSkeleton />}>
          <LatestFindingsSection profileId={profile.id} locale={locale} />
        </Suspense>
      </section>
    </div>
  );
}

async function StatsSection({profileId}: {profileId: string}) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return <StatsSkeleton />;
  }

  const [foundResult, removedResult, submittedResult] = await Promise.all([
    supabase.from('findings').select('id', {count: 'exact', head: true}).eq('user_id', profileId).eq('status', 'Found'),
    supabase.from('findings').select('id', {count: 'exact', head: true}).eq('user_id', profileId).eq('status', 'Removed'),
    supabase
      .from('findings')
      .select('id', {count: 'exact', head: true})
      .eq('user_id', profileId)
      .in('status', ['Submitted', 'Pending'])
  ]);

  const stats = [
    {
      label: 'Found',
      value: foundResult.count ?? 0,
      description: 'Items waiting for your review.'
    },
    {
      label: 'Submitted',
      value: submittedResult.count ?? 0,
      description: 'Takedowns already submitted or in progress.'
    },
    {
      label: 'Removed',
      value: removedResult.count ?? 0,
      description: 'Content removed after takedown.'
    }
  ];

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[20px] border border-[#202228] bg-[#0f1013] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.25)]"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-[#8d939f]">{stat.label}</p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--wlm-text)]">{stat.value}</p>
          <p className="mt-2 text-xs text-[#9aa0a6]">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {Array.from({length: 3}).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[20px] border border-[#202228] bg-[#0f1013] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.25)]"
        >
          <div className="h-3 w-16 rounded bg-[#1f2125]" />
          <div className="mt-4 h-8 w-20 rounded bg-[#1f2125]" />
          <div className="mt-3 h-3 w-32 rounded bg-[#1f2125]" />
        </div>
      ))}
    </div>
  );
}

type DashboardFinding = {
  id: string;
  url: string | null;
  source_type: string | null;
  status: string | null;
  created_at: string | null;
};

async function LatestFindingsSection({profileId, locale}: {profileId: string; locale: 'it' | 'en'}) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return (
      <div className="mt-6 rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da]">
        Unable to load findings right now.
      </div>
    );
  }

  const {data: findings} = await supabase
    .from('findings')
    .select<DashboardFinding>('id, url, source_type, status, created_at')
    .eq('user_id', profileId)
    .order('created_at', {ascending: false})
    .limit(10);

  if (!findings || findings.length === 0) {
    return (
      <div className="mt-6 rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da]">
        No findings yet. As soon as we flag something to review, it will appear here along with quick actions.
      </div>
    );
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="mt-6 overflow-hidden rounded-[18px] border border-[#1f2125]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#16181b] text-xs uppercase tracking-[0.14em] text-[#8d939f]">
          <tr>
            <th className="px-4 py-3 text-left">URL</th>
            <th className="px-4 py-3 text-left">Source</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Captured</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => {
            const status = finding.status ?? 'Found';
            const statusClass = statusStyles[status] ?? statusStyles['Found'];

            return (
              <tr key={finding.id} className="border-t border-[#1f2125]">
                <td className="px-4 py-4 align-top">
                  {finding.url ? (
                    <a
                      href={finding.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-[var(--wlm-yellow)] hover:underline"
                    >
                      {finding.url}
                    </a>
                  ) : (
                    <span className="text-[#9aa0a6]">Unknown</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top text-[#cfd3da]">{finding.source_type ?? '—'}</td>
                <td className="px-4 py-4 align-top">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                    {status}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-[#9aa0a6]">
                  {finding.created_at ? formatter.format(new Date(finding.created_at)) : '—'}
                </td>
                <td className="px-4 py-4 align-top">
                  <CopyLinkButton url={finding.url} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LatestFindingsSkeleton() {
  return (
    <div className="mt-6 overflow-hidden rounded-[18px] border border-[#1f2125]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#16181b] text-xs uppercase tracking-[0.14em] text-[#8d939f]">
          <tr>
            <th className="px-4 py-3 text-left">URL</th>
            <th className="px-4 py-3 text-left">Source</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Captured</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({length: 5}).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[#1f2125]">
              {Array.from({length: 5}).map((__, cellIndex) => (
                <td key={cellIndex} className="px-4 py-4">
                  <div className="h-3 w-full max-w-[180px] animate-pulse rounded bg-[#1f2125]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
