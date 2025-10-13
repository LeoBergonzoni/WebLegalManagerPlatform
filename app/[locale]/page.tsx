'use client';

import {useTranslations} from 'next-intl';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <main>
      <h1>{t('hero_title')}</h1>
      {/* TODO: render the rest of the landing using t('...') keys */}
    </main>
  );
}
