export type Messages = Record<string, unknown>;
export type Dictionary = {
  locale: string;
  messages: Messages;
  fallback: Messages;
};

function getValue(source: Messages, path: string) {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

export type Translator = (key: string) => string;

export function createTranslator(messages: Messages, fallback: Messages): Translator {
  return (key: string) => {
    const value = getValue(messages, key);
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    const fallbackValue = getValue(fallback, key);
    if (typeof fallbackValue === 'string' && fallbackValue.length > 0) {
      return fallbackValue;
    }
    return key;
  };
}
