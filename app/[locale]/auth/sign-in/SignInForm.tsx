'use client';

import {FormEvent, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabaseBrowserClient} from '@/lib/supabase/client';

type SignInFormProps = {
  locale: 'it' | 'en';
};

export default function SignInForm({locale}: SignInFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowserClient(), []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (user) {
      await supabase
        .from('users')
        .upsert(
          {
            auth_user_id: user.id,
            email: user.email ?? email,
            name: user.user_metadata?.full_name ?? null
          },
          {onConflict: 'auth_user_id'}
        );
    }

    router.replace(`/${locale}/app`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--wlm-text)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-[#2a2b2f] bg-[#0f1013] px-3 py-2 text-sm text-[var(--wlm-text)] focus:border-[var(--wlm-yellow)] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--wlm-text)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-[#2a2b2f] bg-[#0f1013] px-3 py-2 text-sm text-[var(--wlm-text)] focus:border-[var(--wlm-yellow)] focus:outline-none"
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600] disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-xs text-[#cfd3da]">
        Need an account?{' '}
        <Link href={`/${locale}/auth/sign-up`} className="text-[var(--wlm-yellow)] underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
