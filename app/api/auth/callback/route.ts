import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';

const DEFAULT_LOCALE = 'en';

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const code = searchParams.get('code');
  const localeFromQuery = searchParams.get('locale');
  const locale = localeFromQuery && ['en', 'it'].includes(localeFromQuery) ? localeFromQuery : DEFAULT_LOCALE;

  if (!code) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/auth/sign-in?error=missing_code`, request.url));
  }

  const supabase = createRouteHandlerClient({cookies});
  const {error} = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/auth/sign-in?error=callback_failed`, request.url));
  }

  return NextResponse.redirect(new URL(`/${locale}/app`, request.url));
}
