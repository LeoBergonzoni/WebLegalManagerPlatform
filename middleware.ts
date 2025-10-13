import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['it', 'en'],
  defaultLocale: 'it'
});

export const config = {
  matcher: ['/', '/(it|en)/:path*']
};
