import {redirect} from 'next/navigation';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import SignUpForm from './SignUpForm';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export default async function SignUpPage({params: {locale}}: PageProps) {
  const supabase = createServerSupabaseClient();
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
        <h1 className="text-2xl font-bold text-[var(--wlm-text)]">Create your account</h1>
        <p className="mt-2 text-sm text-[#cfd3da]">
          Sign up with your email and password to access the Web Legal Manager dashboard.
        </p>
        <div className="mt-6">
          <SignUpForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
