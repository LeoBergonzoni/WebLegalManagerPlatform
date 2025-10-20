'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {useMemo} from 'react';
import {useParams, usePathname} from 'next/navigation';

type Locale = 'it' | 'en';

export default function LandingPageContent() {
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

  const howItWorksCards = [
    {
      title: t('how_card1_title'),
      description: t('how_card1_desc'),
      icon: (
        <svg
          aria-hidden="true"
          className="h-10 w-10 text-[var(--wlm-yellow)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="m16.24 7.76 2.83-2.83" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      )
    },
    {
      title: t('how_card2_title'),
      description: t('how_card2_desc'),
      icon: (
        <svg
          aria-hidden="true"
          className="h-10 w-10 text-[var(--wlm-yellow)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13V5h8" />
          <path d="m5 5 7 7" />
          <path d="M13 11h6v8H5v-2" />
        </svg>
      )
    },
    {
      title: t('how_card3_title'),
      description: t('how_card3_desc'),
      icon: (
        <svg
          aria-hidden="true"
          className="h-10 w-10 text-[var(--wlm-yellow)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7h8l2 3h8" />
          <path d="M5 7v13h14V10" />
          <path d="M9 17h6" />
        </svg>
      )
    }
  ];

  const useCases = [
    {
      title: t('use_case1_title'),
      description: t('use_case1_desc'),
      tag: t('use_case1_tag')
    },
    {
      title: t('use_case2_title'),
      description: t('use_case2_desc'),
      tag: t('use_case2_tag')
    },
    {
      title: t('use_case3_title'),
      description: t('use_case3_desc'),
      tag: t('use_case3_tag')
    }
  ];

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

          <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-6" id="workflow-overview">
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

        <section id="how-it-works" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t('how_title')}</h2>
            <p className="text-sm text-[#cfd3da]">{t('how_section_subtitle')}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorksCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6 transition hover:border-[var(--wlm-yellow)] hover:shadow-[0_12px_40px_rgba(2,6,23,0.45)]"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[var(--wlm-yellow)]/10 p-3">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--wlm-text)]">{card.title}</h3>
                <p className="mt-2 text-sm text-[#cfd3da]">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t('use_cases_title')}</h2>
            <p className="text-sm text-[#cfd3da]">{t('use_cases_subtitle')}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="flex flex-col gap-4 rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6 transition hover:border-[var(--wlm-yellow)] hover:shadow-[0_12px_40px_rgba(2,6,23,0.45)]"
              >
                <div className="aspect-video w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-[#1f2125] via-[#121316] to-[#090a0d]">
                  <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.2em] text-[#3e4452]">
                    {useCase.tag}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[var(--wlm-text)]">{useCase.title}</h3>
                  <p className="text-sm text-[#cfd3da]">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">{t('pricing_title')}</h2>
          <div className="rounded-[16px] border border-[#2a2b2f] bg-[#121316] px-4 py-3 text-sm text-[#f7d560] shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
            {t('pricing_banner')}
          </div>
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
                  href={`/${currentLocale}/auth/sign-in?intent=upgrade`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
                >
                  {`${t('choose')} ${tier.badge}`}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9aa0a6]">{t('success_note')}</p>
        </section>
      </main>

      <footer className="border-t border-[#1b1d21] pt-6 text-xs text-[#a8acb3]">
        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>© {year} WLM – Web Legal Manager</span>
          <div className="flex items-center justify-center gap-4 text-xs text-[#d1d5dc] sm:justify-end">
            <Link
              href={`/${currentLocale}/privacy`}
              className="transition hover:text-[var(--wlm-yellow)]"
            >
              {t('footer_privacy')}
            </Link>
            <Link
              href={`/${currentLocale}/terms`}
              className="transition hover:text-[var(--wlm-yellow)]"
            >
              {t('footer_terms')}
            </Link>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-[#8d939f] sm:text-left">{t('legal')}</p>
      </footer>
    </div>
  );
}
