import Link from 'next/link';
import {getCurrentProfile} from '@/lib/supabase/profile';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: {locale: string};
};

export default async function AppHomePage({params: {locale}}: PageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12 text-[var(--wlm-text)]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-white/80">
            We could not load your account profile right now. If you just confirmed your email, please refresh in a few
            seconds. If the issue persists, contact support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
              href={`/${locale}`}
            >
              Go to home
            </Link>
            <Link
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
              href={`/${locale}/auth/sign-out`}
            >
              Sign out
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-[var(--wlm-text)]">
      <h1 className="text-2xl font-semibold">Welcome back, {profile.name || profile.email}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="text-sm text-white/70">Plan</div>
          <div className="mt-1 text-xl font-semibold capitalize">{profile.plan ?? 'free'}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="text-sm text-white/70">Billing</div>
          <div className="mt-1 text-xl font-semibold capitalize">{profile.billing_status ?? 'inactive'}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="text-sm text-white/70">Status</div>
          <div className="mt-1 text-xl font-semibold">OK</div>
        </div>
      </div>
    </main>
  );
}
