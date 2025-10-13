import {NextResponse} from 'next/server';
import {resetTestStore} from '@/lib/supabase/testStore';

export async function POST() {
  if (process.env.TEST_MODE === 'true') {
    resetTestStore();
    return NextResponse.json({ok: true});
  }
  return NextResponse.json({error: 'Test mode disabled'}, {status: 404});
}
