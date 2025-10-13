'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {useMemo} from 'react';
import {useParams, usePathname} from 'next/navigation';

type Locale = 'it' | 'en';

export default function LandingPage() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = (params?.locale as Locale) ?? 'it';
  const alternateLocale: Locale = currentLocale === 'it' ? 'en' : 'it';

  const alternatePath = useMemo(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const nextSegments = [alternateLocale, ...segments.slice(1)];
    return `/${nextSegments.join('/')}`;
  }, [alternateLocale, pathname]);

  const year = new Date().getFullYear();

  const featureCards = [
    {title: t('f1_t'), description: t('f1_d')},
    {title: t('f2_t'), description: t('f2_d')},
    {title: t('f3_t'), description: t('f3_d')}
  ];

  const pricingTiers = [
    {
      id: 'starter',
      price: '€49',
      cadence: '/mo',
      badge: t('starter'),
      description: t('starter_tag'),
      bullets: [t('starter_1'), t('starter_2'), t('starter_3'), t('starter_4')]
    },
    {
      id: 'pro',
      price: '€149',
      cadence: '/mo',
      badge: t('pro'),
      description: t('pro_tag'),
      bullets: [t('pro_1'), t('pro_2'), t('pro_3'), t('pro_4')]
    }
  ];

  const steps = [t('s1'), t('s2'), t('s3'), t('s4')];
  const chips = [t('chip1'), t('chip2'), t('chip3')];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-6 text-[var(--wlm-text)] md:px-10">
      <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <picture>
            <source srcSet="/Logo/Logo-WLM.png" type="image/png" />
            <img
              src="/Logo/Logo-WLM.jpg"
              alt="WLM – Web Legal Manager"
              className="h-12 w-auto drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
            />
          </picture>
          <span className="rounded-full bg-[var(--wlm-yellow)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#111]">
            {t('brand')}
          </span>
        </div>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link
            href={alternatePath}
            className="rounded-full border border-[#2a2b2f] px-4 py-2 transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
          >
            {alternateLocale.toUpperCase()}
          </Link>
          <Link
            href={`/${currentLocale}/app`}
            className="rounded-full border border-[#2a2b2f] px-4 py-2 text-[var(--wlm-text)] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
          >
            {t('login')}
          </Link>
          <Link
            href={`/${currentLocale}/app`}
            className="rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-[#111] transition hover:bg-[#ffd600]"
          >
            {t('cta')}
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col gap-16 pb-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6">
            <div className="stripe h-2 rounded-lg opacity-80" aria-hidden />
            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              {t('hero_title')}
            </h1>
            <p className="mt-4 text-base text-[#cfd3da] md:text-lg">{t('hero_sub')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[var(--wlm-yellow)] px-3 py-1 text-xs font-semibold tracking-[0.05em] text-[#111]"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${currentLocale}/app`}
                className="rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
              >
                {t('cta')}
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-[#2a2b2f] px-4 py-2 text-sm font-semibold text-[var(--wlm-text)] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
              >
                {t('learn')}
              </a>
            </div>
          </div>

          <div
            id="how-it-works"
            className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6"
          >
            <h2 className="text-lg font-semibold">{t('how_title')}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-[#cfd3da]">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('features_title')}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6"
              >
                <h3 className="text-lg font-semibold text-[var(--wlm-text)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-[#cfd3da]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('pricing_title')}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className="relative rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6"
              >
                <div className="absolute right-6 top-6 rounded-full bg-[var(--wlm-yellow)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#111]">
                  {tier.badge}
                </div>
                <div className="text-4xl font-extrabold text-[var(--wlm-text)]">
                  {tier.price}
                  <span className="ml-1 text-sm font-semibold text-[#9aa0a6]">
                    {tier.cadence}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#9aa0a6]">
                  {tier.description}
                </p>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-[#cfd3da]">
                  {tier.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <Link
                  href={`/${currentLocale}/app`}
                  className="mt-6 inline-flex rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
                >
                  {t('choose')} {tier.badge}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9aa0a6]">{t('success_note')}</p>
        </section>
      </main>

      <footer className="border-t border-[#1b1d21] pt-6 text-xs text-[#a8acb3]">
        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>
            © {year} WLM – Web Legal Manager
          </span>
          <span>{t('legal')}</span>
        </div>
      </footer>
    </div>
  );
}
