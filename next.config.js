const withNextIntl = require('next-intl/plugin')('./i18n/request.js');

module.exports = withNextIntl({
  reactStrictMode: true,
  i18n: {
    locales: ['it', 'en'],
    defaultLocale: 'it'
  }
});
