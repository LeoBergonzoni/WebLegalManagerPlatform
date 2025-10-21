import Link from 'next/link';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-dynamic';

export default async function AdminHomePage({params: {locale}}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin</h1>
          <p className="mt-3 text-sm text-[#cfd3da]">
            Supabase environment variables are missing. Add them to manage your workspace.
          </p>
        </div>
      </div>
    );
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin</h1>
          <p className="mt-3 text-sm text-red-300">Supabase client unavailable.</p>
        </div>
      </div>
    );
  }

  const baseHref = `/${locale}/app/admin`;

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin</h1>
        <p className="mt-3 text-sm text-[#cfd3da]">
          Access key admin tools to manage users and their findings across the platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href={`${baseHref}/users`}
          className="group flex flex-col justify-between rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] transition hover:border-[var(--wlm-yellow)]"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8d939f]">Directory</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--wlm-text)]">Users</h2>
            <p className="mt-2 text-sm text-[#cfd3da]">
              Review every registered account and monitor their findings activity in real time.
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--wlm-yellow)]">
            Open users<span aria-hidden="true">→</span>
          </span>
        </Link>

        <Link
          href={`${baseHref}/findings/new`}
          className="group flex flex-col justify-between rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] transition hover:border-[var(--wlm-yellow)]"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8d939f]">Create</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--wlm-text)]">New finding</h2>
            <p className="mt-2 text-sm text-[#cfd3da]">
              Record infringements for any user account and keep the legal team aligned.
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--wlm-yellow)]">
            Create finding<span aria-hidden="true">→</span>
          </span>
        </Link>

        <Link
          href={`${baseHref}/findings`}
          className="group flex flex-col justify-between rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] transition hover:border-[var(--wlm-yellow)] md:col-span-2"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8d939f]">Oversight</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--wlm-text)]">Manage findings</h2>
            <p className="mt-2 text-sm text-[#cfd3da]">
              Browse every finding, change its status, and keep casework up to date across users.
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--wlm-yellow)]">
            Manage findings<span aria-hidden="true">→</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
