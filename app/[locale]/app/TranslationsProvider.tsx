'use client';

import {createContext, useContext, useMemo, type ReactNode} from 'react';
import {createTranslator, type Dictionary, type Translator} from '@/i18n/translator';

const AppTranslationsContext = createContext<Translator | null>(null);

type ProviderProps = {
  dictionary: Dictionary;
  children: ReactNode;
};

export function AppTranslationsProvider({dictionary, children}: ProviderProps) {
  const translator = useMemo(
    () => createTranslator(dictionary.messages, dictionary.fallback),
    [dictionary]
  );

  return <AppTranslationsContext.Provider value={translator}>{children}</AppTranslationsContext.Provider>;
}

export function useAppTranslations(): Translator {
  const context = useContext(AppTranslationsContext);
  if (!context) {
    throw new Error('useAppTranslations must be used within AppTranslationsProvider');
  }
  return context;
}
