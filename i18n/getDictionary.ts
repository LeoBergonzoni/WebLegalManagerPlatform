'use server';

import {getMessages, normalizeLocale} from '@/lib/i18n';
import {createTranslator, type Dictionary, type Translator} from './translator';

export async function getDictionary(locale: string): Promise<{t: Translator; dictionary: Dictionary}> {
  const normalized = normalizeLocale(locale);
  const fallback = await getMessages('en');
  const messages = normalized === 'en' ? fallback : await getMessages(normalized);

  const dictionary: Dictionary = {
    locale: normalized,
    messages,
    fallback
  };

  const t = createTranslator(dictionary.messages, dictionary.fallback);

  return {t, dictionary};
}
