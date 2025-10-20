'use server';

import {createTranslator, type Dictionary, type Messages, type Translator} from './translator';

async function loadMessages(path: string) {
  const module = await import(path);
  return module.default as Messages;
}

export async function getDictionary(locale: string): Promise<{t: Translator; dictionary: Dictionary}> {
  const fallback = await loadMessages('../messages/en.json');

  let messages = fallback;
  if (locale && locale !== 'en') {
    try {
      messages = await loadMessages(`../messages/${locale}.json`);
    } catch {
      messages = fallback;
    }
  }

  const dictionary: Dictionary = {
    locale: locale || 'en',
    messages,
    fallback
  };

  const t = createTranslator(dictionary.messages, dictionary.fallback);

  return {t, dictionary};
}
