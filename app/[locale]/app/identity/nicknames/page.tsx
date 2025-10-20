import Link from 'next/link';
import NicknamesForm from '../../NicknamesForm';
import {getCurrentProfile} from '@/lib/supabase/profile';
import {getNicknamesForUser} from '@/lib/supabase/nicknames';
import {getDictionary} from '@/i18n/getDictionary';

type PageProps = {
  params: {locale: string};
};

export const dynamic = 'force-dynamic';

export default async function IdentityNicknamesPage({params: {locale}}: PageProps) {
  const {t} = await getDictionary(locale);
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-6 rounded-[18px] border border-white/10 bg-white/5 px-6 py-10 text-[var(--wlm-text)]">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{t('app.nicknames.page.title')}</h1>
          <p className="text-sm text-white/70">{t('app.nicknames.page.errorBody')}</p>
        </div>
        <Link
          href={`/${locale}/app`}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#2a2b2f] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
        >
          ← {t('app.common.backToDashboard')}
        </Link>
      </div>
    );
  }

  const nicknames = await getNicknamesForUser(profile.id);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 rounded-[18px] border border-white/10 bg-white/5 px-6 py-10 text-[var(--wlm-text)]">
      <div className="space-y-3">
        <Link
          href={`/${locale}/app/identity`}
          className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50 transition hover:text-white/80"
        >
          ← {t('app.identity.nicknames.backToIdentity')}
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">{t('app.nicknames.page.title')}</h1>
          <p className="mt-2 text-sm text-white/70">{t('app.nicknames.page.subtitle')}</p>
        </div>
      </div>

      <NicknamesForm
        initialNicknames={nicknames}
        actionPath={`/${locale}/app/identity/nicknames`}
        locale={locale}
      />

      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.16em] text-white/60">{t('app.nicknames.savedTitle')}</span>
          <span className="text-xs font-semibold text-[var(--wlm-yellow)]">
            {t('app.nicknames.savedCount').replace('{count}', String(nicknames.length))}
          </span>
        </div>
        {nicknames.length ? (
          <ul className="mt-4 space-y-2">
            {nicknames.map((nickname) => (
              <li key={nickname} className="rounded-xl border border-white/10 bg-[#121316] px-3 py-2 text-white/90">
                {nickname}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-[#121316] px-3 py-4 text-xs text-white/50">
            {t('app.nicknames.emptyState')}
          </p>
        )}
      </div>
    </div>
  );
}
