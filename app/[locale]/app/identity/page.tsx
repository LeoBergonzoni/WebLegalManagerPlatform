import Link from 'next/link';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';
import {createServiceSupabaseClient, isSupabaseServiceConfigured} from '@/lib/supabase/service';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';
import {isAdmin} from '@/lib/auth';
import IdentityClient from './IdentityClient';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-dynamic';

type SubmissionStatus = 'submitted' | 'approved' | 'rejected';
type DisplayStatus = SubmissionStatus | 'missing';

const statusStyles: Record<DisplayStatus, string> = {
  missing: 'bg-red-500/15 text-red-300 border border-red-500/30',
  submitted: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 border border-red-500/30'
};

const statusLabels: Record<DisplayStatus, string> = {
  missing: 'No submission',
  submitted: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
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

  const supabase = getServerSupabase();
  if (!supabase) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const profile = await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email ?? null}});

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

  const isAdminUser = await isAdmin(user.id);

  const {data: identities, error: identityError} = await supabase
    .from('identities')
    .select('id, doc_type, doc_url, status, verified_at, created_at')
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
  const submissionStatus: SubmissionStatus | null = identity
    ? ((identity.status as SubmissionStatus | null) ??
        (identity.verified_at ? 'approved' : 'submitted'))
    : null;
  const displayStatus: DisplayStatus = submissionStatus ?? 'missing';

  const authUserId = user.id;
  const profileId = profile.id;

type AdminSubmissionRow = {
  id: string;
  user_id: string;
  doc_type: string | null;
  doc_url: string | null;
  status: string;
  created_at: string;
  user: {auth_user_id: string; email: string; name: string | null};
};

  let adminSubmissions: AdminSubmissionRow[] = [];
  let adminLoadError: string | null = null;

  if (isAdminUser && isSupabaseServiceConfigured) {
    const serviceSupabase = createServiceSupabaseClient();
    if (serviceSupabase) {
      const {data, error} = await serviceSupabase
        .from('identities')
        .select(
          `
          id,
          user_id,
          doc_type,
          doc_url,
          status,
          created_at,
          user:users!identities_user_id_fkey(
            auth_user_id,
            email,
            name
          )
        `
        )
        .order('created_at', {ascending: false})
        .returns<AdminSubmissionRow[]>();
      if (error) {
        adminLoadError = error.message;
      } else {
        adminSubmissions = data ?? [];
      }
    } else {
      adminLoadError = 'Supabase service role not configured.';
    }
  }

  const normalizeStatus = (value: string | null | undefined): SubmissionStatus =>
    value === 'approved' || value === 'rejected' ? (value as SubmissionStatus) : 'submitted';

  const formatDate = (isoString: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(isoString));

  async function updateIdentityStatusAction(formData: FormData) {
    'use server';

    const identityId = formData.get('identity_id');
    const nextStatus = formData.get('status');
    if (typeof identityId !== 'string' || typeof nextStatus !== 'string') {
      throw new Error('Invalid request payload');
    }
    if (!['approved', 'rejected'].includes(nextStatus)) {
      throw new Error('Unsupported status change');
    }

    const supabaseAction = getServerSupabase();
    if (!supabaseAction) {
      throw new Error('Supabase not configured');
    }

    const {
      data: {user: currentUser}
    } = await supabaseAction.auth.getUser();

    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const canAdmin = await isAdmin(currentUser.id);
    if (!canAdmin) {
      throw new Error('Forbidden');
    }

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) {
      throw new Error('Supabase service role not configured');
    }

    const updates: Record<string, unknown> = {
      status: nextStatus
    };
    if (nextStatus === 'approved') {
      updates.verified_at = new Date().toISOString();
    } else if (nextStatus === 'rejected') {
      updates.verified_at = null;
    }

    const {error: updateError} = await serviceSupabase.from('identities').update(updates).eq('id', identityId);
    if (updateError) {
      throw new Error(updateError.message);
    }

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

      <span
        className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${statusStyles[displayStatus]}`}
      >
        Status: {statusLabels[displayStatus]}
      </span>

      <IdentityClient authUserId={authUserId} profileId={profileId} identity={identity} />

      {isAdminUser ? (
        <section className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--wlm-text)]">Admin • Identity submissions</h2>
              <p className="mt-1 text-sm text-[#cfd3da]">
                Review uploaded documents from every account and update their status after verification.
              </p>
            </div>
          </div>

          {adminLoadError ? (
            <p className="mt-4 rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Unable to load submissions: {adminLoadError}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[#16181b] text-xs uppercase tracking-[0.16em] text-[#8d939f]">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Doc type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Uploaded at</th>
                    <th className="px-4 py-3 text-left">Document</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#cfd3da]">
                        No submissions received yet.
                      </td>
                    </tr>
                  ) : (
                    adminSubmissions.map((submission) => {
                      const normalizedStatus = normalizeStatus(submission.status);
                      const statusLabel = statusLabels[normalizedStatus];
                      return (
                        <tr key={submission.id} className="border-t border-[#1f2125] text-[var(--wlm-text)]">
                          <td className="px-4 py-3">
                            {submission.user?.name?.trim() || submission.user?.email || 'Unknown'}
                            <div className="text-xs text-[#8d939f]">
                              {submission.user?.auth_user_id ?? '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#cfd3da]">{submission.user?.email ?? '—'}</td>
                          <td className="px-4 py-3 text-[#cfd3da]">{submission.doc_type ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[normalizedStatus]}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#cfd3da]">
                            {formatDate(submission.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {submission.doc_url ? (
                              <a
                                href={submission.doc_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-[var(--wlm-yellow)] underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-sm text-[#8d939f]">Unavailable</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <form action={updateIdentityStatusAction}>
                                <input type="hidden" name="identity_id" value={submission.id} />
                                <input type="hidden" name="status" value="approved" />
                                <button
                                  type="submit"
                                  className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-[#0b0b0b] transition hover:bg-emerald-400"
                                  disabled={normalizedStatus === 'approved'}
                                >
                                  Approve
                                </button>
                              </form>
                              <form action={updateIdentityStatusAction}>
                                <input type="hidden" name="identity_id" value={submission.id} />
                                <input type="hidden" name="status" value="rejected" />
                                <button
                                  type="submit"
                                  className="rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-[#0b0b0b] transition hover:bg-red-400"
                                  disabled={normalizedStatus === 'rejected'}
                                >
                                  Reject
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
