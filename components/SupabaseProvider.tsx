'use client';

import {useEffect, useState, type ReactNode} from 'react';
import {SessionContextProvider} from '@supabase/auth-helpers-react';
import {createBrowserClient} from '@supabase/ssr';

type SupabaseProviderProps = {
  children: ReactNode;
};

export function SupabaseProvider({children}: SupabaseProviderProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [supabase] = useState(() =>
    supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const statusChannel = supabase
      .channel('connection-status')
      .on('broadcast', {event: '*'}, () => {})
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [supabase]);

  if (!supabase) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase client is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return <>{children}</>;
  }

  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
