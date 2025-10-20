import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';
import {isAdmin} from '@/lib/auth';

type AdminUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  findings: {status: 'Found' | 'Pending' | 'Submitted' | 'Removed'}[] | null;
};

const statusOrder: Array<'Found' | 'Pending' | 'Submitted' | 'Removed'> = ['Found', 'Pending', 'Submitted', 'Removed'];

const statusLabels: Record<string, string> = {
  Found: 'Found',
  Pending: 'Pending',
  Submitted: 'Submitted',
  Removed: 'Removed'
};

const statusColors: Record<string, string> = {
  Found: 'text-slate-200',
  Pending: 'text-amber-200',
  Submitted: 'text-blue-200',
  Removed: 'text-emerald-200'
};

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({params: {locale}}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Users</h1>
          <p className="mt-3 text-sm text-[#cfd3da]">
            Supabase environment variables are missing. Add them to review the user list.
          </p>
        </div>
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

  const profile = await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email}});
  if (!profile) {
    redirect(`/${locale}/app`);
  }

  const isAdminUser = await isAdmin(user.id);
  if (!isAdminUser) {
    redirect(`/${locale}/app`);
  }

  const {data: users, error} = await supabase
    .from('users')
    .select('id, email, name, findings:findings(status)')
    .returns<AdminUserRow[]>()
    .order('created_at', {ascending: false});

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Users</h1>
          <p className="mt-3 text-sm text-red-300">Unable to load users: {error.message}</p>
        </div>
      </div>
    );
  }

  const safeUsers = Array.isArray(users) ? users : [];

  const summaries = safeUsers.map((row) => {
    const stats = Array.isArray(row.findings) ? row.findings : [];
    const counts = stats.reduce(
      (acc, item) => {
        const status = item.status ?? 'Found';
        acc[status] = (acc[status] ?? 0) + 1;
        acc.total += 1;
        return acc;
      },
      {Found: 0, Pending: 0, Submitted: 0, Removed: 0, total: 0} as Record<string, number>
    );
    return {
      id: row.id,
      email: row.email ?? 'unknown',
      name: row.name ?? row.email ?? 'Unknown',
      counts
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • Users</h1>
        <p className="mt-3 text-sm text-[#cfd3da]">
          Discover customer activity at a glance. Click a status badge to jump straight into their findings.
        </p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#1f2125] bg-[#121316] shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#16181b] text-xs uppercase tracking-[0.16em] text-[#8d939f]">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Total findings</th>
              <th className="px-4 py-3 text-left">Status breakdown</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#cfd3da]">
                  No users found. As soon as accounts sign in they will appear here.
                </td>
              </tr>
            ) : (
              summaries.map((summary) => (
                <tr key={summary.id} className="border-t border-[#1f2125]">
                  <td className="px-4 py-4 align-top text-[var(--wlm-text)]">{summary.name}</td>
                  <td className="px-4 py-4 align-top text-[#cfd3da]">{summary.email}</td>
                  <td className="px-4 py-4 align-top text-[#cfd3da]">{summary.counts.total}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {statusOrder.map((status) => {
                        const value = summary.counts[status] ?? 0;
                        if (value === 0) return null;
                        const color = statusColors[status] ?? 'text-[#cfd3da]';
                        const label = statusLabels[status] ?? status;
                        return (
                          <Link
                            key={`${summary.id}-${status}`}
                            href={`/${locale}/app/findings?status=${encodeURIComponent(status)}&user=${summary.id}`}
                            className={`inline-flex items-center rounded-full border border-[#2a2b2f] px-3 py-1 text-xs font-semibold ${color} transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]`}
                          >
                            {label}: {value}
                          </Link>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
