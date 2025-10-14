import Link from 'next/link';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createServerSupabaseClient, isSupabaseConfigured} from '@/lib/supabase/server';
import IdentityClient from './IdentityClient';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-dynamic';

const statusStyles: Record<'missing' | 'uploaded' | 'verified', string> = {
  missing: 'bg-red-500/15 text-red-300 border border-red-500/30',
  uploaded: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  verified: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
};

const statusLabels: Record<'missing' | 'uploaded' | 'verified', string> = {
  missing: 'Missing',
  uploaded: 'Uploaded',
  verified: 'Verified'
};

export default async function IdentityPage({params: {locale}}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Identity document</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da]">
          Supabase environment variables are not configured. Add{' '}
          <code className="rounded bg-[#1f2125] px-1 py-0.5 text-xs text-[var(--wlm-yellow)]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{' '}
          and{' '}
          <code className="rounded bg-[#1f2125] px-1 py-0.5 text-xs text-[var(--wlm-yellow)]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{' '}
          to enable the KYC workflow.
        </p>
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
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Identity document</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da]">
          We&apos;re setting up your account profile. Please refresh the page in a moment or contact support if this
          message remains.
        </p>
      </div>
    );
  }

  const {data: identities, error: identityError} = await supabase
    .from('identities')
    .select('id, doc_type, doc_url, verified_at, created_at')
    .eq('user_id', profile.id)
    .order('created_at', {ascending: false})
    .limit(1);

  if (identityError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Identity document</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-red-300">
          Unable to load your identity record: {identityError.message}
        </p>
      </div>
    );
  }

  const identity = identities?.[0] ?? null;
  const status: 'missing' | 'uploaded' | 'verified' = identity
    ? identity.verified_at
      ? 'verified'
      : 'uploaded'
    : 'missing';

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const userEmailLower = user.email?.toLowerCase() ?? '';
  const isAdmin = adminEmails.includes(userEmailLower) && !!identity && !identity.verified_at;

  const authUserId = user.id;
  const profileId = profile.id;
  const identityId = identity?.id ?? null;

  async function verifyIdentityAction() {
    'use server';

    const adminList = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (!adminList.length || !identityId) {
      return;
    }

    const supabaseAction = createServerSupabaseClient();
    if (!supabaseAction) {
      return;
    }

    const {
      data: {user: currentUser}
    } = await supabaseAction.auth.getUser();

    if (!currentUser || currentUser.id !== authUserId) {
      return;
    }

    const currentEmail = currentUser.email?.toLowerCase() ?? '';
    if (!adminList.includes(currentEmail)) {
      return;
    }

    await supabaseAction
      .from('identities')
      .update({verified_at: new Date().toISOString()})
      .eq('id', identityId)
      .eq('user_id', profileId);

    revalidatePath(`/${locale}/app/identity`);
    revalidatePath(`/${locale}/app`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Identity document</h1>
          <p className="mt-2 text-sm text-[#cfd3da]">
            Upload a valid identity document to help us prepare contracts faster.
          </p>
        </div>
        <Link
          href={`/${locale}/app`}
          className="rounded-full border border-[#2a2b2f] px-4 py-2 text-sm font-semibold text-[var(--wlm-text)] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
        >
          Go to Dashboard
        </Link>
      </div>

      <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${statusStyles[status]}`}>
        Status: {statusLabels[status]}
      </span>

      <IdentityClient authUserId={authUserId} profileId={profileId} identity={identity} />

      {isAdmin ? (
        <form action={verifyIdentityAction} className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-200">
            Admin shortcut: mark this document as verified for the current user.
          </p>
          <button
            type="submit"
            className="mt-3 inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0b0b0b] transition hover:bg-emerald-400"
          >
            Verify identity now
          </button>
        </form>
      ) : null}
    </div>
  );
}
