const {getRequestConfig} = require('next-intl/server');

module.exports = getRequestConfig(async ({locale}) => {
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages
  };
});

module.exports.locales = ['it', 'en'];
module.exports.defaultLocale = 'it';
