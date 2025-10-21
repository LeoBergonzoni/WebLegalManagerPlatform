import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

type AdminFindingRow = {
  id: string;
  status: string;
  url: string | null;
  source_type: string | null;
  created_at: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

const STATUS_OPTIONS = ['Found', 'Pending', 'Submitted', 'Removed', 'Rejected'] as const;

function isValidStatus(value: string): value is (typeof STATUS_OPTIONS)[number] {
  return STATUS_OPTIONS.includes(value as (typeof STATUS_OPTIONS)[number]);
}

export const dynamic = 'force-dynamic';

export default async function AdminFindingsPage({params: {locale}}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Findings</h1>
          <p className="mt-3 text-sm text-[#cfd3da]">
            Supabase environment variables are missing. Add them to manage findings.
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
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Findings</h1>
          <p className="mt-3 text-sm text-red-300">Supabase client unavailable.</p>
        </div>
      </div>
    );
  }

  const {data, error} = await supabase
    .from('findings')
    .select(
      'id, status, url, source_type, created_at, user:users(id, name, email)'
    )
    .order('created_at', {ascending: false});

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Findings</h1>
          <p className="mt-3 text-sm text-red-300">Unable to load findings: {error.message}</p>
        </div>
      </div>
    );
  }

  const findings = Array.isArray(data) ? (data as AdminFindingRow[]) : [];

  async function updateFindingStatus(formData: FormData) {
    'use server';

    const supabaseAction = getServerSupabase();
    if (!supabaseAction) {
      throw new Error('Supabase configuration missing');
    }

    const {
      data: {user}
    } = await supabaseAction.auth.getUser();

    if (!user) {
      redirect(`/${locale}/auth/sign-in?next=/${locale}/app/admin/findings`);
    }

    const {data: adminProfile, error: adminError} = await supabaseAction
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (adminError || !adminProfile?.is_admin) {
      redirect(`/${locale}/app`);
    }

    const findingId = formData.get('finding_id');
    const status = formData.get('status');

    if (typeof findingId !== 'string' || !findingId) {
      return;
    }

    if (typeof status !== 'string' || !isValidStatus(status)) {
      return;
    }

    const {error: updateError} = await supabaseAction
      .from('findings')
      .update({status})
      .eq('id', findingId);

    if (updateError) {
      throw updateError;
    }

    revalidatePath(`/${locale}/app/admin/findings`);
    revalidatePath(`/${locale}/app/findings`, 'page');
  }

  const statusLabels: Record<string, string> = {
    Found: 'FOUND',
    Pending: 'PENDING',
    Submitted: 'SUBMITTED',
    Removed: 'REMOVED',
    Rejected: 'REJECTED'
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Findings</h1>
        <p className="mt-3 text-sm text-[#cfd3da]">
          Review every finding in the platform and update its status as the investigation progresses.
        </p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#1f2125] bg-[#121316] shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#16181b] text-xs uppercase tracking-[0.16em] text-[#8d939f]">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Finding</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {findings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#cfd3da]">
                  No findings recorded yet. Create one from the admin tools to see it listed here.
                </td>
              </tr>
            ) : (
              findings.map((finding) => {
                const user = finding.user ?? null;
                const displayName = user?.name?.trim() || user?.email || 'Unknown user';
                const displayEmail = user?.email ?? 'unknown@example.com';
                const displayUrl = finding.url ?? 'No URL provided';
                const currentStatus = finding.status ?? 'Found';
                const statusLabel = statusLabels[currentStatus] ?? currentStatus.toUpperCase();
                const updatedAt = finding.created_at
                  ? new Date(finding.created_at).toLocaleString()
                  : '—';

                return (
                  <tr key={finding.id} className="border-t border-[#1f2125]">
                    <td className="px-4 py-4 align-top text-[var(--wlm-text)]">{displayName}</td>
                    <td className="px-4 py-4 align-top text-[#cfd3da]">{displayEmail}</td>
                    <td className="px-4 py-4 align-top text-[#cfd3da]">
                      <div className="space-y-1">
                        <a
                          href={finding.url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[var(--wlm-yellow)] hover:underline"
                        >
                          {displayUrl}
                        </a>
                        <p className="text-xs uppercase tracking-[0.12em] text-[#8d939f]">
                          Source: {finding.source_type ?? '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <form action={updateFindingStatus} className="space-y-2">
                        <input type="hidden" name="finding_id" value={finding.id} />
                        <select
                          name="status"
                          defaultValue={currentStatus}
                          className="w-44 rounded-[14px] border border-[#2a2b2f] bg-[#0f1013] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#cfd3da] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-3 py-1 text-xs font-semibold text-[#111] transition hover:bg-[#ffd600]"
                        >
                          Update status
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-[#8d939f]">{updatedAt}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
