import type {ReactNode} from 'react';
import {requireAdminOrRedirect} from '@/lib/guards';

type AdminLayoutProps = {
  children: ReactNode;
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({children, params: {locale}}: AdminLayoutProps) {
  await requireAdminOrRedirect(locale);
  return <>{children}</>;
}
