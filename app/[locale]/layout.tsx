import {NextIntlClientProvider} from 'next-intl';
import {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import {locales} from '../../i18n/request';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: {locale: string};
}) {
  const {locale} = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
