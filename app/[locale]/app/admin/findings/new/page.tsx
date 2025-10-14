import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createServerSupabaseClient, isSupabaseConfigured} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';
import NewFindingForm, {type NewFindingFormState} from '../NewFindingForm';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

export const dynamic = 'force-dynamic';

export default async function AdminNewFindingPage({params: {locale}}: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • New finding</h1>
          <p className="mt-3 text-sm text-[#cfd3da]">
            Supabase environment variables are missing. Add them before creating findings manually.
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
    redirect(`/${locale}/app`);
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes((user.email ?? '').toLowerCase());
  if (!isAdmin) {
    redirect(`/${locale}/app`);
  }

  const {data: users, error} = await supabase
    .from('users')
    .select('id, email, name')
    .order('created_at', {ascending: false});

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
          <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • New finding</h1>
          <p className="mt-3 text-sm text-red-300">Unable to load users: {error.message}</p>
        </div>
      </div>
    );
  }

  const userOptions: UserOption[] = (users ?? []).map((row) => ({
    id: row.id,
    email: row.email ?? 'unknown@example.com',
    name: row.name ?? row.email ?? 'Unknown user'
  }));

  async function createFinding(
    _prevState: NewFindingFormState,
    formData: FormData
  ): Promise<NewFindingFormState> {
    'use server';

    const supabaseAction = createServerSupabaseClient();
    if (!supabaseAction) {
      return {status: 'error', message: 'Supabase configuration missing'};
    }

    const {
      data: {user: currentUser}
    } = await supabaseAction.auth.getUser();

    if (!currentUser) {
      return {status: 'error', message: 'Not authenticated'};
    }

    const actingProfile = await ensureUserProfile({supabase: supabaseAction, authUser: currentUser});
    if (!actingProfile) {
      return {status: 'error', message: 'Profile not available'};
    }

    const adminList = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const canCreate = adminList.includes((currentUser.email ?? '').toLowerCase());
    if (!canCreate) {
      return {status: 'error', message: 'You are not allowed to create findings'};
    }

    const userId = formData.get('user_id');
    const url = formData.get('url');
    const sourceType = formData.get('source_type');
    const note = formData.get('note');

    if (typeof userId !== 'string' || !userId) {
      return {status: 'error', message: 'Select a user'};
    }
    if (typeof url !== 'string' || !url.trim()) {
      return {status: 'error', message: 'Provide a valid URL'};
    }
    if (typeof sourceType !== 'string' || !sourceType.trim()) {
      return {status: 'error', message: 'Provide a source type'};
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      url: url.trim(),
      source_type: sourceType.trim(),
      status: 'Found',
      created_at: new Date().toISOString()
    };

    if (note && typeof note === 'string' && note.trim()) {
      payload.evidence = {note: note.trim()};
    }

    const {error: insertError} = await supabaseAction.from('findings').insert(payload);

    if (insertError) {
      return {status: 'error', message: insertError.message};
    }

    revalidatePath(`/${locale}/app`);
    revalidatePath(`/${locale}/app/findings?user=${userId}`, 'page');

    return {status: 'success', message: 'Finding created and queued for review.'};
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <h1 className="text-3xl font-extrabold text-[var(--wlm-text)]">Admin • New finding</h1>
        <p className="mt-3 text-sm text-[#cfd3da]">
          Create a manual finding for a user when external monitoring surfaces urgent infringements.
        </p>
      </div>

      <NewFindingForm users={userOptions} action={createFinding} />
    </div>
  );
}
