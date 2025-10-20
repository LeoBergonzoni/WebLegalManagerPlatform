import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';
import {isAdmin} from '@/lib/auth';
import FindingsListClient from './FindingsListClient';
import {ensureUserProfile, type UserProfileRow} from '@/lib/users/ensureUserProfile';

type PageProps = {
  params: {locale: 'it' | 'en'};
  searchParams?: {status?: string; page?: string; user?: string};
};

const PAGE_SIZE = 10;
const STATUS_FILTERS = ['All', 'Found', 'Pending', 'Submitted', 'Removed', 'Rejected'] as const;

export const dynamic = 'force-dynamic';

function parseStatusFilter(raw: string | undefined) {
  if (!raw) return 'All';
  return STATUS_FILTERS.includes(raw as (typeof STATUS_FILTERS)[number]) ? raw : 'All';
}

function parsePage(raw: string | undefined) {
  const page = Number(raw);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function FindingsPage({params: {locale}, searchParams}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Findings</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da]">
          Supabase environment variables are missing. Add them to review findings.
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

  const profile = await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email}});

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Findings</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da]">
          We&apos;re preparing your account profile. Please refresh shortly or contact support if you continue to see
          this message.
        </p>
      </div>
    );
  }

  const isAdminUser = await isAdmin(user.id);

  const statusFilter = parseStatusFilter(searchParams?.status);
  const page = parsePage(searchParams?.page);
  const targetUserId = searchParams?.user && isAdminUser ? searchParams.user : profile.id;

  let targetProfile: UserProfileRow = profile;
  if (targetUserId !== profile.id) {
    const {data: otherProfile} = await supabase
      .from('users')
      .select('id, auth_user_id, email, name')
      .eq('id', targetUserId)
      .returns<UserProfileRow[]>()
      .maybeSingle();
    if (otherProfile) {
      targetProfile = otherProfile;
    } else {
      targetProfile = profile;
    }
  }

  let query = supabase
    .from('findings')
    .select('id, url, source_type, status, created_at', {count: 'exact'})
    .eq('user_id', targetProfile.id);

  if (statusFilter !== 'All') {
    query = query.eq('status', statusFilter);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {data: findings, count, error: findingsError} = await query
    .order('created_at', {ascending: false})
    .range(from, to);

  if (findingsError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Findings</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-red-300">
          Failed to load findings: {findingsError.message}
        </p>
      </div>
    );
  }

  async function approveFinding(formData: FormData) {
    'use server';
    const findingId = formData.get('finding_id');
    const targetUserIdFromForm = formData.get('user_id');
    if (typeof findingId !== 'string' || typeof targetUserIdFromForm !== 'string') {
      throw new Error('Invalid request');
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

    const actingProfile = await ensureUserProfile({
      supabase: supabaseAction,
      authUser: {id: currentUser.id, email: currentUser.email}
    });
    if (!actingProfile) {
      throw new Error('Profile not found');
    }

    const canActOnAnyUser = await isAdmin(currentUser.id);

    const targetUserIdFinal = canActOnAnyUser ? targetUserIdFromForm : actingProfile.id;
    if (!canActOnAnyUser && targetUserIdFromForm !== actingProfile.id) {
      throw new Error('You are not allowed to update this finding');
    }

    const {error: updateError} = await supabaseAction
      .from('findings')
      .update({status: 'Pending'})
      .eq('id', findingId)
      .eq('user_id', targetUserIdFinal);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabaseAction.from('takedowns').insert({
      finding_id: findingId,
      user_id: targetUserIdFinal,
      channel: 'search_form',
      submitted_at: new Date().toISOString()
    });

    revalidatePath(`/${locale}/app/findings?user=${targetUserIdFinal}`, 'page');
  }

  async function rejectFinding(formData: FormData) {
    'use server';
    const findingId = formData.get('finding_id');
    const targetUserIdFromForm = formData.get('user_id');
    if (typeof findingId !== 'string' || typeof targetUserIdFromForm !== 'string') {
      throw new Error('Invalid request');
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

    const actingProfile = await ensureUserProfile({
      supabase: supabaseAction,
      authUser: {id: currentUser.id, email: currentUser.email}
    });
    if (!actingProfile) {
      throw new Error('Profile not found');
    }

    const canActOnAnyUser = await isAdmin(currentUser.id);

    const targetUserIdFinal = canActOnAnyUser ? targetUserIdFromForm : actingProfile.id;
    if (!canActOnAnyUser && targetUserIdFromForm !== actingProfile.id) {
      throw new Error('You are not allowed to update this finding');
    }

    const {error: updateError} = await supabaseAction
      .from('findings')
      .update({status: 'Rejected'})
      .eq('id', findingId)
      .eq('user_id', targetUserIdFinal);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/${locale}/app/findings?user=${targetUserIdFinal}`, 'page');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Findings</h1>
            <p className="mt-1 text-sm text-[#cfd3da]">
              Review each finding and approve the takedown process or reject when it does not require action.
            </p>
          </div>
          {isAdminUser && targetProfile.id !== profile.id ? (
            <span className="inline-flex items-center rounded-full border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9aa0a6]">
              Viewing: {targetProfile.name ?? targetProfile.email}
            </span>
          ) : null}
        </div>
      </div>

      <FindingsListClient
        findings={(findings ?? []).map((finding) => ({
          ...finding,
          created_at: finding.created_at
        }))}
        locale={locale}
        approveAction={approveFinding}
        rejectAction={rejectFinding}
        statusFilter={statusFilter}
        statusOptions={Array.from(STATUS_FILTERS)}
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        targetUserId={targetProfile.id}
        allowAdminFilters={isAdminUser}
      />
    </div>
  );
}
