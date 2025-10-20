'use server';

import {revalidatePath} from 'next/cache';
import {getServerSupabase} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';
import {replaceNicknamesForUser} from '@/lib/supabase/nicknames';
import {getDictionary} from '@/i18n/getDictionary';

export type NicknamesFormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

export const initialNicknamesFormState: NicknamesFormState = {
  status: 'idle'
};

export async function saveNicknamesAction(
  _prevState: NicknamesFormState,
  formData: FormData
): Promise<NicknamesFormState> {
  const explicitLocale = formData.get('locale');
  const path = formData.get('path');
  const inferredLocale =
    typeof explicitLocale === 'string' && explicitLocale
      ? explicitLocale
      : typeof path === 'string'
      ? path.split('/').filter(Boolean)[0] ?? 'en'
      : 'en';

  const {t} = await getDictionary(inferredLocale);

  const supabase = getServerSupabase();
  if (!supabase) {
    return {status: 'error', message: t('app.nicknames.errors.authUnavailable')};
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    return {status: 'error', message: t('app.nicknames.errors.notAuthenticated')};
  }

  const profile = await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email}});

  if (!profile) {
    return {status: 'error', message: t('app.nicknames.errors.profileUnavailable')};
  }

  const rawNicknames = formData.getAll('nicknames');
  const nicknames = rawNicknames
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
    .slice(0, 4);

  const {ok, error} = await replaceNicknamesForUser(profile.id, nicknames, supabase);

  if (!ok) {
    const message = error
      ? `${t('app.nicknames.errors.saveFailed')}: ${error}`
      : t('app.nicknames.errors.saveFailed');
    return {status: 'error', message};
  }

  if (typeof path === 'string' && path.startsWith('/')) {
    revalidatePath(path);
  }

  return {
    status: 'success',
    message: nicknames.length ? t('app.nicknames.success.updated') : t('app.nicknames.success.cleared')
  };
}
