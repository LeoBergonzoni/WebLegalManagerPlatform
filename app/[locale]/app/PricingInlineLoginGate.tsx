 'use client';

import Link from 'next/link';
import {useAppTranslations} from './TranslationsProvider';

type PricingInlineLoginGateProps = {
  locale: string;
  currentPlanLabel: string;
};

export default function PricingInlineLoginGate({locale, currentPlanLabel}: PricingInlineLoginGateProps) {
  const t = useAppTranslations();

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

  return (
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
            <Link
              href={`/${locale}/auth/sign-in?intent=upgrade`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
            >
              {`${t('choose')} ${tier.badge}`}
            </Link>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#9aa0a6]">{t('success_note')}</p>
    </section>
  );
}
