import {getRequestConfig} from 'next-intl/server';
import {getMessages, normalizeLocale} from '@/lib/i18n';

export default getRequestConfig(async ({locale}) => {
  const resolvedLocale = normalizeLocale(locale);
  const messages = await getMessages(resolvedLocale);
  return {locale: resolvedLocale, messages};
});
