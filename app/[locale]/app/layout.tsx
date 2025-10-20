import type {ReactNode} from 'react';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';
import {isAdmin} from '@/lib/auth';
import {getDictionary} from '@/i18n/getDictionary';
import {AppTranslationsProvider} from './TranslationsProvider';
import UserMenu from './UserMenu';

type LayoutProps = {
  children: ReactNode;
  params: {locale: 'it' | 'en'};
};

type NavLink = {
  href: string;
  label: string;
};

function NavigationSection({title, links}: {title: string; links: NavLink[]}) {
  if (!links.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8d939f]">{title}</p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-[14px] border border-transparent bg-[#121316] px-4 py-2 text-sm font-medium text-[#d9dce2] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AppLayout({children, params: {locale}}: LayoutProps) {
  const {t, dictionary} = await getDictionary(locale);

  if (!isSupabaseConfigured) {
    return (
      <ErrorBoundary>
        <AppTranslationsProvider dictionary={dictionary}>
          <div className="min-h-screen bg-[#0f1013] text-[var(--wlm-text)]">
            <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">{children}</main>
          </div>
        </AppTranslationsProvider>
      </ErrorBoundary>
    );
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const profile = await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email}});
  if (!profile) {
    return (
      <ErrorBoundary>
        <AppTranslationsProvider dictionary={dictionary}>
          <div className="min-h-screen bg-[#0f1013] text-[var(--wlm-text)]">
            <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
              <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-8 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
                <h1 className="text-2xl font-bold text-[var(--wlm-text)]">{t('app.layout.profileError.title')}</h1>
                <p className="mt-3 text-sm text-[#cfd3da]">{t('app.layout.profileError.body')}</p>
              </div>
            </main>
          </div>
        </AppTranslationsProvider>
      </ErrorBoundary>
    );
  }

  const baseLinks: NavLink[] = [
    {href: `/${locale}/app`, label: t('app.layout.nav.dashboard')},
    {href: `/${locale}/app/identity`, label: t('app.layout.nav.identity')},
    {href: `/${locale}/app/findings`, label: t('app.layout.nav.findings')}
  ];

  const isAdminUser = await isAdmin(user.id);

  const adminLinks: NavLink[] = isAdminUser
    ? [
        {href: `/${locale}/app/admin/users`, label: t('app.layout.nav.adminUsers')},
        {href: `/${locale}/app/admin/findings/new`, label: t('app.layout.nav.adminNewFinding')}
      ]
    : [];

  async function signOutAction() {
    'use server';
    const supabaseAction = getServerSupabase();
    if (supabaseAction) {
      await supabaseAction.auth.signOut();
    }
    redirect(`/${locale}/auth/sign-in`);
  }

  const identityHref = `/${locale}/app/identity`;
  const billingHref = `/${locale}/app/billing`;
  const dashboardHref = `/${locale}/app`;
  const findingsHref = `/${locale}/app/findings`;

  return (
    <ErrorBoundary>
      <AppTranslationsProvider dictionary={dictionary}>
        <div className="min-h-screen bg-[#0f1013] text-[var(--wlm-text)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:px-10 lg:py-12">
          <aside className="space-y-8 lg:w-72">
            <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
              <p className="text-xs uppercase tracking-[0.12em] text-[#8d939f]">{t('app.layout.sidebar.signedInAs')}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--wlm-text)]">
                {profile.name?.trim() || user.email || t('app.layout.sidebar.accountFallback')}
              </p>
              <p className="mt-1 text-xs text-[#9aa0a6]">{user.email ?? t('app.layout.sidebar.noEmail')}</p>
            </div>

            <NavigationSection title={t('app.layout.sections.workspace')} links={baseLinks} />
            {isAdminUser ? <NavigationSection title={t('app.layout.sections.admin')} links={adminLinks} /> : null}
          </aside>

          <div className="flex-1 space-y-8 pb-16">
            <header className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-5 shadow-[0_12px_30px_rgba(2,6,23,0.3)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[var(--wlm-yellow)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#111]">
                    {t('app.layout.sections.workspace')}
                  </div>
                  <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#9aa0a6]">
                    <Link href={dashboardHref} className="rounded-full border border-transparent px-3 py-1 transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]">
                      {t('app.layout.nav.dashboard')}
                    </Link>
                    <Link href={findingsHref} className="rounded-full border border-transparent px-3 py-1 transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]">
                      {t('app.layout.nav.findings')}
                    </Link>
                    <Link href={identityHref} className="rounded-full border border-transparent px-3 py-1 transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]">
                      {t('app.layout.nav.identity')}
                    </Link>
                  </nav>
                </div>
                <UserMenu
                  name={profile.name?.trim() || ''}
                  email={user.email ?? ''}
                  identityHref={identityHref}
                  billingHref={billingHref}
                  adminHref={isAdminUser ? `/${locale}/app/admin/users` : undefined}
                  isAdmin={isAdminUser}
                  signOutAction={signOutAction}
                  labels={{
                    account: t('app.userMenu.account'),
                    signedInAs: t('app.userMenu.signedIn'),
                    admin: t('app.userMenu.admin'),
                    uploadId: t('app.userMenu.uploadId'),
                    billing: t('app.userMenu.billing'),
                    signOut: t('app.userMenu.signOut')
                  }}
                />
              </div>
            </header>

            <main className="space-y-8">{children}</main>
          </div>
        </div>
        </div>
      </AppTranslationsProvider>
    </ErrorBoundary>
  );
}
