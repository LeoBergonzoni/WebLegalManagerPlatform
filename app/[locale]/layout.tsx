import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import {getMessages, normalizeLocale} from '@/lib/i18n';
import '../globals.css';

export function generateStaticParams() {
  return [{locale: 'it'}, {locale: 'en'}];
}

export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: ReactNode;
  params: {locale: 'it' | 'en'};
}) {
  const loc = normalizeLocale(locale);
  if (loc !== locale) {
    notFound();
  }

  const messages = await getMessages(loc);

  return (
    <html lang={loc}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <NextIntlClientProvider locale={loc} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
