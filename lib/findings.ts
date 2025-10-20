import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';

type FindingStats = {
  removed: number;
  delisted: number;
  total: number;
};

type ProfileRow = {
  id: string;
};

type TakedownRow = {
  result: string | null;
};

const EMPTY_STATS: FindingStats = {removed: 0, delisted: 0, total: 0};

export async function getUserFindingStats(): Promise<FindingStats> {
  'use server';

  if (!isSupabaseConfigured) {
    return EMPTY_STATS;
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return EMPTY_STATS;
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_STATS;
  }

  const {data: profile} = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.id) {
    return EMPTY_STATS;
  }

  const {data: takedowns, error} = await supabase
    .from('takedowns')
    .select('result')
    .eq('user_id', profile.id)
    .returns<TakedownRow[]>();

  if (error || !takedowns) {
    return EMPTY_STATS;
  }

  let removed = 0;
  let delisted = 0;

  for (const row of takedowns) {
    const value = row.result?.toLowerCase();
    if (value === 'removed') {
      removed += 1;
    } else if (value === 'delisted') {
      delisted += 1;
    }
  }

  const total = removed + delisted;

  return {removed, delisted, total};
}
