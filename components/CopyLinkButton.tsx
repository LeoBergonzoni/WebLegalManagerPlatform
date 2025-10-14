'use client';

import {useEffect, useRef, useState} from 'react';

type CopyLinkButtonProps = {
  url: string | null | undefined;
  className?: string;
};

export default function CopyLinkButton({url, className}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const disabled = !url;

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border border-[#2a2b2f] px-3 py-1 text-xs font-semibold text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)] disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ''}`}
      title={copied ? 'Copied!' : disabled ? 'No link available' : 'Copy link'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path d="M12.586 2.586a2 2 0 0 1 2.828 2.828l-1.793 1.793a.75.75 0 0 1-1.06-1.06l1.793-1.794a.5.5 0 0 0-.708-.707l-3.182 3.182a.75.75 0 1 1-1.06-1.06l3.182-3.182ZM7.707 7.707a.75.75 0 0 1 1.06 0l3.182 3.182a.75.75 0 1 1-1.06 1.06L7.707 8.768a.75.75 0 0 1 0-1.06Z" />
        <path d="M7.414 2.586a2 2 0 0 1 2.828 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.062-1.06a.5.5 0 0 0-.708 0L5.192 6.928a.5.5 0 0 0 0 .707l3.182 3.182a.5.5 0 0 0 .708 0l1.061-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.062a2 2 0 0 1-2.83 0L4.485 8.677a2 2 0 0 1 0-2.829l2.93-2.93Z" />
      </svg>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
