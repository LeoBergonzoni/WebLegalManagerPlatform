import {redirect} from 'next/navigation';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import SignInForm from './SignInForm';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export default async function SignInPage({params: {locale}}: PageProps) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-16">
        <div className="w-full rounded-[18px] border border-[#1f2125] bg-[#121316] p-8 shadow">
          <h1 className="text-2xl font-bold text-[var(--wlm-text)]">Not configured</h1>
          <p className="mt-2 text-sm text-[#cfd3da]">
            Supabase environment variables are missing. Add them to use authentication.
          </p>
        </div>
      </div>
    );
  }

  let userId: string | null = null;

  try {
    const {
      data: {user}
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (userId) {
    redirect(`/${locale}/app`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-16">
      <div className="w-full rounded-[18px] border border-[#1f2125] bg-[#121316] p-8 shadow">
        <h1 className="text-2xl font-bold text-[var(--wlm-text)]">Sign in</h1>
        <p className="mt-2 text-sm text-[#cfd3da]">
          Access your dashboard with the credentials you used during registration.
        </p>
        <div className="mt-6">
          <SignInForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
