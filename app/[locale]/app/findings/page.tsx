import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createServerSupabaseClient, isSupabaseConfigured} from '@/lib/supabase/server';
import FindingsListClient from './FindingsListClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export default async function FindingsPage({params: {locale}}: PageProps) {
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

  const {data: profile, error: profileError} = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
        <h1 className="text-3xl font-extrabold">Findings</h1>
        <p className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-red-300">
          Unable to load your account profile. Please try again later.
        </p>
      </div>
    );
  }

  const {data: findings, error: findingsError} = await supabase
    .from('findings')
    .select('id, url, source_type, status, created_at')
    .eq('user_id', profile.id)
    .order('created_at', {ascending: false});

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
    if (typeof findingId !== 'string') {
      throw new Error('Invalid finding identifier');
    }

    const supabaseAction = createServerSupabaseClient();
    if (!supabaseAction) {
      throw new Error('Supabase not configured');
    }

    const {
      data: {user: currentUser}
    } = await supabaseAction.auth.getUser();

    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const {data: profileRow, error: profileErr} = await supabaseAction
      .from('users')
      .select('id')
      .eq('auth_user_id', currentUser.id)
      .single();

    if (profileErr || !profileRow) {
      throw new Error('Profile not found');
    }

    const {error: updateError} = await supabaseAction
      .from('findings')
      .update({status: 'Pending'})
      .eq('id', findingId)
      .eq('user_id', profileRow.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabaseAction.from('takedowns').insert({
      finding_id: findingId,
      user_id: profileRow.id,
      channel: 'search_form',
      submitted_at: new Date().toISOString()
    });

    revalidatePath(`/${locale}/app/findings`);
    revalidatePath(`/${locale}/app`);
  }

  async function rejectFinding(formData: FormData) {
    'use server';
    const findingId = formData.get('finding_id');
    if (typeof findingId !== 'string') {
      throw new Error('Invalid finding identifier');
    }

    const supabaseAction = createServerSupabaseClient();
    if (!supabaseAction) {
      throw new Error('Supabase not configured');
    }

    const {
      data: {user: currentUser}
    } = await supabaseAction.auth.getUser();

    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const {data: profileRow, error: profileErr} = await supabaseAction
      .from('users')
      .select('id')
      .eq('auth_user_id', currentUser.id)
      .single();

    if (profileErr || !profileRow) {
      throw new Error('Profile not found');
    }

    const {error: updateError} = await supabaseAction
      .from('findings')
      .update({status: 'Rejected'})
      .eq('id', findingId)
      .eq('user_id', profileRow.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/${locale}/app/findings`);
    revalidatePath(`/${locale}/app`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Findings</h1>
          <p className="mt-2 text-sm text-[#cfd3da]">
            Review each finding and approve the takedown process or reject when it does not require action.
          </p>
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
      />
    </div>
  );
}
