import type {ReactNode} from 'react';
import Link from 'next/link';
import MetricsSection from './MetricsSection';
import NicknamesForm from './NicknamesForm';
import PricingInlineLoginGate from './PricingInlineLoginGate';
import {getCurrentProfile} from '@/lib/supabase/profile';
import {getNicknamesForUser} from '@/lib/supabase/nicknames';
import {getUserFindingStats} from '@/lib/findings';
import {getDictionary} from '@/i18n/getDictionary';

export const dynamic = 'force-dynamic'; // evita cache SSR che nasconde errori

type PageProps = {
  params: {locale: string};
};

export default async function AppHomePage({params: {locale}}: PageProps) {
  const {t} = await getDictionary(locale);

  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch (err) {
    console.error('[dashboard] load profile failed', {err});
    profile = null;
  }

  let findingStats = {removed: 0, delisted: 0, total: 0};
  try {
    findingStats = await getUserFindingStats();
  } catch (err) {
    console.error('[dashboard] load finding stats failed', {err});
    findingStats = {removed: 0, delisted: 0, total: 0};
  }

  const translateOrDefault = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12 text-[var(--wlm-text)]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h1 className="mb-2 text-2xl font-semibold">{t('app.dashboard.loadingError.title')}</h1>
          <p className="text-sm text-white/80">{t('app.dashboard.loadingError.body')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
              href={`/${locale}`}
            >
              {t('app.common.goHome')}
            </Link>
            <Link
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
              href={`/${locale}/auth/sign-out`}
            >
              {t('app.common.signOut')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let nicknames: string[] = [];
  try {
    nicknames = await getNicknamesForUser(profile.id);
  } catch (err) {
    console.error('[dashboard] load nicknames failed', {err});
    nicknames = [];
  }

  const accountPlan = profile?.plan ?? 'free';
  const accountBillingStatus = profile?.billing_status ?? 'inactive';
  const plan = (accountPlan ?? 'free').toLowerCase();
  const planDisplay = translateOrDefault(`app.dashboard.planNames.${plan}`, accountPlan ?? 'free');
  const billingStatus = (accountBillingStatus ?? 'inactive').toLowerCase();
  const billingDisplay = translateOrDefault(
    `app.dashboard.billingStatuses.${billingStatus}`,
    accountBillingStatus ?? 'inactive'
  );
  const welcomeFallback = translateOrDefault('app.dashboard.welcomeFallback', 'User');
  const welcomeName = profile.name?.trim() || profile.email || welcomeFallback;
  const welcomeHeading = t('app.dashboard.welcome').replace('{name}', welcomeName);
  const statusDisplay = t('app.dashboard.status.ok');

  const pricingSection: ReactNode =
    plan === 'free' ? (
      <PricingInlineLoginGate
        locale={locale}
        currentPlanLabel={t('app.dashboard.pricing.currentPlan').replace('{plan}', planDisplay)}
      />
    ) : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-[var(--wlm-text)]">
      <h1 className="text-2xl font-semibold">{welcomeHeading}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="text-sm text-white/70">{t('app.dashboard.cards.plan')}</div>
          <div className="mt-1 text-xl font-semibold">{planDisplay}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="text-sm text-white/70">{t('app.dashboard.cards.billing')}</div>
          <div className="mt-1 text-xl font-semibold">{billingDisplay}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="text-sm text-white/70">{t('app.dashboard.cards.status')}</div>
          <div className="mt-1 text-xl font-semibold">{statusDisplay}</div>
        </div>
      </div>

      {pricingSection}

      <MetricsSection
        stats={{
          removed: Number(findingStats?.removed ?? 0),
          delisted: Number(findingStats?.delisted ?? 0),
          total: Number(findingStats?.total ?? 0)
        }}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--wlm-yellow)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wlm-yellow)]">
                {t('app.nicknames.pill')}
              </div>
              <h2 className="mt-3 text-xl font-semibold">{t('app.nicknames.title')}</h2>
              <p className="mt-1 text-sm text-white/70">{t('app.nicknames.subtitle')}</p>
            </div>
            <NicknamesForm initialNicknames={nicknames} actionPath={`/${locale}/app`} locale={locale} />
            <div className="text-xs text-white/60">
              {t('app.nicknames.moreSpacePrompt')}{' '}
              <Link
                href={`/${locale}/app/identity/nicknames`}
                className="font-semibold text-[var(--wlm-yellow)] transition hover:text-white"
              >
                {t('app.nicknames.openPage')}
              </Link>
              .
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-5 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-white/60">{t('app.nicknames.savedTitle')}</span>
              <span className="text-xs font-semibold text-[var(--wlm-yellow)]">
                {t('app.nicknames.savedCount').replace('{count}', String(nicknames.length))}
              </span>
            </div>
            {nicknames.length ? (
              <ul className="space-y-2">
                {nicknames.map((nickname) => (
                  <li key={nickname} className="rounded-xl border border-white/10 bg-[#121316] px-3 py-2 text-white/90">
                    {nickname}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-white/20 bg-[#121316] px-3 py-4 text-xs text-white/50">
                {t('app.nicknames.emptyState')}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
