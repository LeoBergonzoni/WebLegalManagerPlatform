'use client';

import {FormEvent, useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabaseBrowserClient} from '@/lib/supabase/client';

type SignInFormProps = {
  locale: 'it' | 'en';
};

export default function SignInForm({locale}: SignInFormProps) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof supabaseBrowserClient>>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const client = supabaseBrowserClient();
    if (!client) {
      setNotConfigured(true);
      return;
    }

    setSupabase(client);
    setInitialized(true);
  }, []);

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
    setInfoMessage(null);

    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      setLoading(false);
      return;
    }

    const callbackRedirect =
      process.env.NEXT_PUBLIC_SITE_URL &&
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?locale=${locale}`;

    const signInPayload: {
      email: string;
      password: string;
      options?: Record<string, unknown>;
    } = {
      email,
      password
    };

    if (callbackRedirect) {
      signInPayload.options = {emailRedirectTo: callbackRedirect};
    }

    try {
      const {data, error} = await supabase.auth.signInWithPassword(signInPayload as any);

      if (error) {
        throw error;
      }

      if (data.session) {
        router.replace(`/${locale}/app`);
        router.refresh();
        return;
      }

      setInfoMessage('Check your inbox for the secure sign-in link to finish signing in.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  if (notConfigured) {
    return (
      <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-4 text-sm text-[#cfd3da]">
        Supabase is not configured. Please add the required environment variables.
      </div>
    );
  }

  if (!initialized || !supabase) {
    return (
      <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-4 text-sm text-[#cfd3da]">
        Loading authentication form…
      </div>
    );
  }

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
      {infoMessage ? <p className="text-sm text-[var(--wlm-yellow)]">{infoMessage}</p> : null}

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
