import Link from 'next/link';
import {getTranslations} from 'next-intl/server';

type Params = {
  params: {locale: 'it' | 'en'};
};

export function generateStaticParams() {
  return [{locale: 'it'}, {locale: 'en'}];
}

export default async function TermsPage({params: {locale}}: Params) {
  const t = await getTranslations({locale});

  return (
    <div className="mx-auto flex min-h-screen max-w-wlm flex-col px-6 py-10 text-wlm-text">
      <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-8">
        <h1 className="text-3xl font-extrabold">{t('terms_title')}</h1>
        <p className="mt-4 text-base leading-relaxed text-[#cfd3da]">
          {t('terms_body')}
        </p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-wlm-yellow px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-wlm-yellow-strong"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}
