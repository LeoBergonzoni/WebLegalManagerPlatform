import {NextResponse} from 'next/server';
import {getServerSupabase} from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({userPresent: false, userId: null, supabaseConfigured: false});
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  return NextResponse.json({
    userPresent: Boolean(user),
    userId: user?.id ?? null,
    supabaseConfigured: true
  });
}
