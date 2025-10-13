import './globals.css';
import type {Metadata} from 'next';
import {cookies} from 'next/headers';
import {Inter} from 'next/font/google';
import clsx from 'clsx';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Web Legal Manager – Content Takedowns',
  description:
    'Delisting & source removals for stolen content. Fast, privacy-first. IT/EN.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = cookies().get('NEXT_LOCALE')?.value ?? 'it';

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={clsx(inter.variable, 'bg-wlm-body')}>{children}</body>
    </html>
  );
}
