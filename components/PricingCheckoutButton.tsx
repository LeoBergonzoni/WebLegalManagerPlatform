'use client';

import {useState} from 'react';

type PricingCheckoutButtonProps = {
  plan: 'starter' | 'pro';
  children: React.ReactNode;
  disabled?: boolean;
};

export default function PricingCheckoutButton({plan, children, disabled}: PricingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({plan})
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Unable to start checkout.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url as string;
      } else {
        setError('Checkout session missing redirect URL.');
        setLoading(false);
      }
    } catch (err) {
      setError((err as Error).message || 'Unexpected error.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="inline-flex items-center justify-center rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600] disabled:cursor-not-allowed disabled:opacity-60"
        title={disabled ? 'Stripe checkout not configured' : undefined}
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  );
}
