import type {ReactNode} from 'react';
import Link from 'next/link';
import MetricsSection from './MetricsSection';
import NicknamesForm from './NicknamesForm';
import PricingCheckoutButton from '@/components/PricingCheckoutButton';
import {getCurrentProfile} from '@/lib/supabase/profile';
import {getNicknamesForUser} from '@/lib/supabase/nicknames';
import {getUserFindingStats} from '@/lib/findings';
import {getDictionary} from '@/i18n/getDictionary';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: {locale: string};
};

export default async function AppHomePage({params: {locale}}: PageProps) {
  const {t} = await getDictionary(locale);
  const profile = await getCurrentProfile();
  const findingStats = await getUserFindingStats();
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

  const nicknames = await getNicknamesForUser(profile.id);
  const normalizedPlan = (profile.plan ?? 'free').toLowerCase();
  const hasPaymentMethod = Boolean(profile.stripe_customer_id);
  const stripeEnabled = Boolean(
    process.env.STRIPE_PUBLIC_KEY &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_STARTER &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.NEXT_PUBLIC_SITE_URL
  );
  const planKey = (profile.plan ?? 'free').toLowerCase();
  const planDisplay = translateOrDefault(`app.dashboard.planNames.${planKey}`, String(profile.plan ?? 'free'));
  const billingKey = (profile.billing_status ?? 'inactive').toLowerCase();
  const billingDisplay = translateOrDefault(
    `app.dashboard.billingStatuses.${billingKey}`,
    String(profile.billing_status ?? 'inactive')
  );
  const welcomeFallback = translateOrDefault('app.dashboard.welcomeFallback', 'User');
  const welcomeName = profile.name?.trim() || profile.email || welcomeFallback;
  const welcomeHeading = t('app.dashboard.welcome').replace('{name}', welcomeName);
  const statusDisplay = t('app.dashboard.status.ok');

  let pricingSection: ReactNode = null;

  if (normalizedPlan === 'free') {
    const pricingTiers = [
      {
        plan: 'starter' as const,
        id: 'starter',
        price: '€49',
        cadence: '/mo',
        badge: t('starter'),
        description: t('starter_tag'),
        bullets: [t('starter_1'), t('starter_2'), t('starter_3'), t('starter_4')]
      },
      {
        plan: 'pro' as const,
        id: 'pro',
        price: '€149',
        cadence: '/mo',
        badge: t('pro'),
        description: t('pro_tag'),
        bullets: [t('pro_1'), t('pro_2'), t('pro_3'), t('pro_4')]
      }
    ];
    const currentPlanLabel = t('app.dashboard.pricing.currentPlan').replace('{plan}', planDisplay);

    pricingSection = (
      <section className="mt-8 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t('app.dashboard.pricing.title')}</h2>
            <p className="text-sm text-white/70">{t('app.dashboard.pricing.subtitle')}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
            {currentPlanLabel}
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {pricingTiers.map((tier) => (
            <div key={tier.id} className="relative rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6">
              <div className="absolute right-6 top-6 rounded-full bg-[var(--wlm-yellow)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#111]">
                {tier.badge}
              </div>
              <div className="text-4xl font-extrabold text-[var(--wlm-text)]">
                {tier.price}
                <span className="ml-1 text-sm font-semibold text-[#9aa0a6]">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#9aa0a6]">{tier.description}</p>
              <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-[#cfd3da]">
                {tier.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="mt-6">
                {hasPaymentMethod ? (
                  <PricingCheckoutButton plan={tier.plan} disabled={!stripeEnabled}>
                    {stripeEnabled ? `${t('choose')} ${tier.badge}` : t('app.dashboard.pricing.checkoutUnavailable')}
                  </PricingCheckoutButton>
                ) : (
                  <Link
                    href={`/${locale}/auth/sign-in?intent=upgrade`}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
                  >
                    {`${t('choose')} ${tier.badge}`}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#9aa0a6]">{t('success_note')}</p>
      </section>
    );
  }

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

      <MetricsSection stats={findingStats} />

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
