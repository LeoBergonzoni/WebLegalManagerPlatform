'use client';

import {useEffect} from 'react';

export default function AppError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  useEffect(() => {
    // log client-side per incrociare con i function logs SSR
    console.error('[dashboard] client boundary', {message: error.message, digest: error.digest});
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <h1 className="text-2xl font-semibold mb-4">Qualcosa è andato storto 😔</h1>
      {error?.digest ? <p className="text-sm opacity-70 mb-3">Digest: {error.digest}</p> : null}
      <button onClick={reset} className="rounded-full bg-yellow-400 px-5 py-2 font-medium">
        Riprova
      </button>
    </div>
  );
}
