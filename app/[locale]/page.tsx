import Image from 'next/image';
import Link from 'next/link';
import {getLocale, getTranslations} from 'next-intl/server';
import LocaleSwitcher from '../../components/LocaleSwitcher';

const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-wlm-yellow px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-wlm-yellow-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-wlm-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

const ghostButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-[#2a2b2f] bg-transparent px-4 py-2 text-sm font-semibold text-wlm-text transition hover:border-wlm-yellow hover:text-wlm-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-wlm-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

const cardClasses =
  'rounded-[18px] border border-[#1f2125] bg-[#121316] p-6 shadow-none';

const featureCardClasses =
  'rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-5 shadow-none';

export default async function LandingPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto flex min-h-screen max-w-wlm flex-col px-6 py-6 text-wlm-text">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-[46px] w-[46px]">
            <Image
              src="/Logo/Logo-WLM.png"
              alt="WLM – Web Legal Manager logo"
              width={184}
              height={184}
              className="h-full w-auto drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
              priority
            />
          </div>
          <span className="rounded-full bg-wlm-yellow px-3 py-1 text-xs font-semibold tracking-[0.03em] text-[#111]">
            {t('brand')}
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href={`/${locale}/app`} className={ghostButtonClasses}>
            {t('login')}
          </Link>
          <Link href={`/${locale}/app`} className={primaryButtonClasses}>
            {t('cta')}
          </Link>
        </nav>
      </header>

      <main className="mt-9 flex-1">
        <section className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={cardClasses}>
            <div className="stripe h-2 rounded-[10px] opacity-80" aria-hidden />
            <h1 className="mt-3 text-[clamp(28px,4vw,54px)] font-extrabold leading-[1.04]">
              {t('hero_title')}
            </h1>
            <p className="mt-2 text-[clamp(16px,2.4vw,20px)] text-[#cfd3da]">
              {t('hero_sub')}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {[t('chip1'), t('chip2'), t('chip3')].map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-wlm-yellow px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#111]"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/${locale}/app`} className={primaryButtonClasses}>
                {t('cta')}
              </Link>
              <Link href="#how-it-works" className={ghostButtonClasses}>
                {t('learn')}
              </Link>
            </div>
          </div>

          <div className={cardClasses} id="how-it-works">
            <h3 className="text-lg font-semibold">{t('how_title')}</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[#cfd3da]">
              <li>{t('s1')}</li>
              <li>{t('s2')}</li>
              <li>{t('s3')}</li>
              <li>{t('s4')}</li>
            </ol>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{t('features_title')}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className={featureCardClasses}>
              <h3 className="text-lg font-semibold">{t('f1_t')}</h3>
              <p className="mt-2 text-sm text-[#cfd3da]">{t('f1_d')}</p>
            </div>
            <div className={featureCardClasses}>
              <h3 className="text-lg font-semibold">{t('f2_t')}</h3>
              <p className="mt-2 text-sm text-[#cfd3da]">{t('f2_d')}</p>
            </div>
            <div className={featureCardClasses}>
              <h3 className="text-lg font-semibold">{t('f3_t')}</h3>
              <p className="mt-2 text-sm text-[#cfd3da]">{t('f3_d')}</p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{t('pricing_title')}</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="relative rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6">
              <div className="absolute right-4 top-4 rounded-full bg-wlm-yellow px-3 py-1 text-xs font-semibold tracking-[0.03em] text-[#111]">
                {t('starter')}
              </div>
              <div className="text-4xl font-extrabold">
                €49<span className="ml-1 text-sm font-semibold text-[#9aa0a6]">/mo</span>
              </div>
              <p className="mt-2 text-xs font-semibold tracking-[0.03em] text-[#9aa0a6]">
                {t('starter_tag')}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#cfd3da]">
                <li>{t('starter_1')}</li>
                <li>{t('starter_2')}</li>
                <li>{t('starter_3')}</li>
                <li>{t('starter_4')}</li>
              </ul>
              <Link href={`/${locale}/app`} className={`mt-3 ${primaryButtonClasses}`}>
                {t('choose')} Starter
              </Link>
            </div>
            <div className="relative rounded-[18px] border border-[#1b1d21] bg-[#0f1013] p-6">
              <div className="absolute right-4 top-4 rounded-full bg-wlm-yellow px-3 py-1 text-xs font-semibold tracking-[0.03em] text-[#111]">
                {t('pro')}
              </div>
              <div className="text-4xl font-extrabold">
                €149<span className="ml-1 text-sm font-semibold text-[#9aa0a6]">/mo</span>
              </div>
              <p className="mt-2 text-xs font-semibold tracking-[0.03em] text-[#9aa0a6]">
                {t('pro_tag')}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#cfd3da]">
                <li>{t('pro_1')}</li>
                <li>{t('pro_2')}</li>
                <li>{t('pro_3')}</li>
                <li>{t('pro_4')}</li>
              </ul>
              <Link href={`/${locale}/app`} className={`mt-3 ${primaryButtonClasses}`}>
                {t('choose')} Pro
              </Link>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#9aa0a6]">{t('success_note')}</p>
        </section>
      </main>

      <footer className="mt-12 border-t border-[#1b1d21] py-5 text-xs text-[#a8acb3]">
        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>© {year} WLM – Web Legal Manager</span>
          <span>{t('legal')}</span>
        </div>
      </footer>
    </div>
  );
}
