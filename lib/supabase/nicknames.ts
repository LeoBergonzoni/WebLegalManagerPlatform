'use server';

import type {SupabaseClient} from '@supabase/supabase-js';
import {getSupabaseServer} from './profile';

async function resolveClient(provided?: SupabaseClient) {
  if (provided) {
    return provided;
  }
  return getSupabaseServer();
}

export async function getNicknamesForUser(userId: string, client?: SupabaseClient): Promise<string[]> {
  const supabase = await resolveClient(client);
  if (!supabase) {
    return [];
  }

  const {data, error} = await supabase
    .from('nicknames')
    .select('nickname, position')
    .eq('user_id', userId)
    .order('position', {ascending: true});

  if (error || !data?.length) {
    return [];
  }

  return data
    .map((row) => row.nickname?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0));
}

export async function replaceNicknamesForUser(
  userId: string,
  nicknames: string[],
  client?: SupabaseClient
): Promise<{ok: boolean; error?: string}> {
  const supabase = await resolveClient(client);
  if (!supabase) {
    return {ok: false, error: 'Supabase client unavailable'};
  }

  const {error: removeError} = await supabase.from('nicknames').delete().eq('user_id', userId);

  if (removeError) {
    return {ok: false, error: removeError.message};
  }

  const sanitized = nicknames
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 4);

  if (!sanitized.length) {
    return {ok: true};
  }

  const payload = sanitized.map((nickname, index) => ({
    user_id: userId,
    nickname,
    position: index
  }));

  const {error: insertError} = await supabase.from('nicknames').insert(payload);

  if (insertError) {
    return {ok: false, error: insertError.message};
  }

  return {ok: true};
}
