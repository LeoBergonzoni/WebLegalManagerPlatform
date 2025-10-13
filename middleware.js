const createMiddleware = require('next-intl/middleware');

const middleware = createMiddleware({
  locales: ['it', 'en'],
  defaultLocale: 'it'
});

module.exports = middleware;

module.exports.config = {
  matcher: ['/', '/(it|en)/:path*']
};
