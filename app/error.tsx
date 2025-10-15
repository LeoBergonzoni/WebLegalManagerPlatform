'use client';

type ErrorBoundaryProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorBoundary({error, reset}: ErrorBoundaryProps) {
  console.error(error);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0f1013] px-6 text-center text-[var(--wlm-text)]">
      <h2 className="text-2xl font-semibold">Qualcosa è andato storto 😔</h2>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600]"
      >
        Riprova
      </button>
    </div>
  );
}
