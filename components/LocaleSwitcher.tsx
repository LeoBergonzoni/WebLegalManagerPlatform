'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import {ChangeEvent} from 'react';

const supportedLocales = ['it', 'en'] as const;

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    if (nextLocale === locale) return;

    const segments = pathname.split('/');
    if (segments.length > 1) {
      segments[1] = nextLocale;
    }

    const nextPath =
      segments.length > 1 ? segments.join('/') || `/${nextLocale}` : `/${nextLocale}`;

    router.push(nextPath);
    router.refresh();
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="rounded-full border border-[#2a2b2f] bg-[#16181b] px-3 py-2 text-sm font-semibold text-wlm-text outline-none transition hover:border-wlm-yellow focus:border-wlm-yellow"
    >
      {supportedLocales.map((code) => (
        <option key={code} value={code}>
          {code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
