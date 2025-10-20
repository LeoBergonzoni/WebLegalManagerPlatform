import NicknamesForm from '@/components/NicknamesForm';
import {getMessages, normalizeLocale} from '@/lib/i18n';

export async function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'it'}];
}

export const dynamic = 'force-dynamic';

export default async function NicknamesPage({params}: {params: {locale: string}}) {
  const locale = normalizeLocale(params?.locale);
  const messages = await getMessages(locale);

  return <NicknamesForm title={messages['nicknames_title'] ?? 'Nicknames'} />;
}
