'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';

type UserMenuProps = {
  name?: string;
  email?: string;
  identityHref: string;
  billingHref: string;
  signOutAction: () => Promise<void>;
};

export default function UserMenu({name, email, identityHref, billingHref, signOutAction}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = name?.trim() || email || 'Account';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-sm font-semibold text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wlm-yellow)] text-sm font-bold text-[#111]">
          {initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs uppercase tracking-[0.14em] text-[#8d939f]">Account</span>
          <span className="block text-sm font-semibold text-[var(--wlm-text)]">{displayName}</span>
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-60 overflow-hidden rounded-[16px] border border-[#1f2125] bg-[#121316] shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <div className="border-b border-[#1f2125] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8d939f]">Signed in</p>
            <p className="mt-1 text-sm font-semibold text-[var(--wlm-text)]">{displayName}</p>
            {email ? <p className="text-xs text-[#9aa0a6]">{email}</p> : null}
          </div>

          <div className="flex flex-col gap-1 px-2 py-3">
            <Link
              href={identityHref}
              className="rounded-[12px] px-3 py-2 text-sm font-medium text-[#cfd3da] transition hover:bg-[#1a1c21] hover:text-[var(--wlm-yellow)]"
              onClick={() => setOpen(false)}
            >
              Upload ID
            </Link>
            <Link
              href={billingHref}
              className="rounded-[12px] px-3 py-2 text-sm font-medium text-[#cfd3da] transition hover:bg-[#1a1c21] hover:text-[var(--wlm-yellow)]"
              onClick={() => setOpen(false)}
            >
              Billing &amp; plan
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full rounded-[12px] px-3 py-2 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
