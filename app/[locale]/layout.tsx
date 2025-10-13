import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {ReactNode} from 'react';

type Props = {
  children: ReactNode;
  params: {locale: string};
};

export function generateStaticParams() {
  return [{locale: 'it'}, {locale: 'en'}];
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = params;

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
