import './globals.css';
import type {Metadata} from 'next';
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
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
