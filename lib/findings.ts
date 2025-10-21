import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';

type FindingStats = {
  removed: number;
  delisted: number;
  total: number;
};

type ProfileRow = {
  id: string;
};

type FindingStatusRow = {
  id: string;
  status: string | null;
};

type TakedownRow = {
  finding_id: string | null;
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

  const {data: findingsRows, error: findingsError} = await supabase
    .from('findings')
    .select('id, status')
    .eq('user_id', profile.id)
    .returns<FindingStatusRow[]>();

  if (findingsError) {
    return EMPTY_STATS;
  }

  const removedIds = new Set<string>();
  const delistedIds = new Set<string>();

  const normalizedFindings = Array.isArray(findingsRows) ? findingsRows : [];

  for (const row of normalizedFindings) {
    const status = row.status?.toLowerCase();
    if (status === 'removed') {
      removedIds.add(row.id);
    } else if (status === 'delisted') {
      delistedIds.add(row.id);
    }
  }

  const {data: takedowns} = await supabase
    .from('takedowns')
    .select('finding_id, result')
    .eq('user_id', profile.id)
    .returns<TakedownRow[]>();

  const takedownRows = Array.isArray(takedowns) ? takedowns : [];
  let fallbackKey = 0;

  for (const row of takedownRows) {
    const value = row.result?.toLowerCase();
    if (value === 'removed') {
      const key = row.finding_id ?? `removed:${fallbackKey++}`;
      removedIds.add(key);
    } else if (value === 'delisted') {
      const key = row.finding_id ?? `delisted:${fallbackKey++}`;
      delistedIds.add(key);
    }
  }

  const removed = removedIds.size;
  const delisted = delistedIds.size;
  const total = removed + delisted;

  return {removed, delisted, total};
}
