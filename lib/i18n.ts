// lib/i18n.ts
// Loader messaggi i18n con import statici (compatibili con bundling/prerender)
export type Locale = 'en' | 'it';

export async function getMessages(locale: Locale) {
  try {
    switch (locale) {
      case 'it':
        return (await import('@/messages/it.json')).default;
      case 'en':
      default:
        return (await import('@/messages/en.json')).default;
    }
  } catch (e) {
    const en = (await import('@/messages/en.json')).default;
    return en;
  }
}

// Helper per sanificare una locale qualsiasi
export function normalizeLocale(input?: string): Locale {
  return input === 'it' ? 'it' : 'en';
}
