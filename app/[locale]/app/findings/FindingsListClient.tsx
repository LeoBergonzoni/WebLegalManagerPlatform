'use client';

import {useEffect, useMemo, useOptimistic, useState, useTransition} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import CopyLinkButton from '@/components/CopyLinkButton';

type Finding = {
  id: string;
  url: string | null;
  source_type: string | null;
  status: string | null;
  created_at: string | null;
};

type OptimisticUpdate = {
  id: string;
  status: string;
};

type FindingsListClientProps = {
  findings: Finding[];
  locale: 'it' | 'en';
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
  statusFilter: string;
  statusOptions: string[];
  page: number;
  pageSize: number;
  total: number;
  targetUserId: string;
  allowAdminFilters: boolean;
};

const statusStyles: Record<string, string> = {
  Found: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  Pending: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
  Submitted: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  Removed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
  Rejected: 'bg-red-500/20 text-red-200 border border-red-500/30'
};

const STATUS_PENDING = 'Pending';
const STATUS_REJECTED = 'Rejected';

export default function FindingsListClient({
  findings,
  locale,
  approveAction,
  rejectAction,
  statusFilter,
  statusOptions,
  page,
  pageSize,
  total,
  targetUserId,
  allowAdminFilters
}: FindingsListClientProps) {
  const [optimisticFindings, applyOptimistic] = useOptimistic<Finding[], OptimisticUpdate>(
    findings,
    (current, update) =>
      current.map((finding) =>
        finding.id === update.id ? {...finding, status: update.status} : finding
      )
  );

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; tone: 'success' | 'error'} | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
    [locale]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const setOptimisticStatus = (id: string, status: string) => {
    applyOptimistic({id, status});
  };

  const revertStatus = (id: string, previousStatus: string | null | undefined) => {
    applyOptimistic({id, status: previousStatus ?? 'Found'});
  };

  const updateQuery = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    Object.entries(next).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`${pathname}?${params.toString()}`, {scroll: false});
  };

  const handleStatusChange = (value: string) => {
    updateQuery({
      status: value === 'All' ? null : value,
      page: null
    });
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    updateQuery({page: String(nextPage)});
  };

  const handleAction = (
    id: string,
    nextStatus: string,
    action: (formData: FormData) => Promise<void>,
    successMessage: string
  ) => {
    const previousStatus = optimisticFindings.find((item) => item.id === id)?.status;

    setOptimisticStatus(id, nextStatus);
    setPendingId(id);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('finding_id', id);
      formData.set('user_id', targetUserId);

      try {
        await action(formData);
        setToast({message: successMessage, tone: 'success'});
      } catch (error) {
        revertStatus(id, previousStatus);
        setToast({
          message: (error as Error)?.message ?? 'Unable to update finding. Please try again.',
          tone: 'error'
        });
      } finally {
        setPendingId(null);
      }
    });
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = total === 0 ? 0 : Math.min(total, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-[#1f2125] bg-[#121316] p-4 shadow-[0_12px_30px_rgba(2,6,23,0.3)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="status-filter" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d939f]">
              Status filter
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="rounded-full border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#cfd3da] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-[#8d939f]">
              Showing {showingFrom}-{showingTo} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={isFirstPage}
                className="rounded-full border border-[#2a2b2f] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={isLastPage}
                className="rounded-full border border-[#2a2b2f] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#cfd3da] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#1f2125] bg-[#121316]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#16181b] text-xs uppercase tracking-wide text-[#cfd3da]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">URL</th>
              <th className="px-4 py-3 text-left font-semibold">Source</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {optimisticFindings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#cfd3da]">
                  {allowAdminFilters ? (
                    <span>
                      No findings match the selected filters. Adjust the filters or pick another user to continue.
                    </span>
                  ) : (
                    <span>
                      No findings yet. As soon as your monitoring detects risky content, it will appear here ready for
                      review.
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              optimisticFindings.map((finding) => {
                const status = finding.status ?? 'Found';
                const statusClass = statusStyles[status] ?? statusStyles['Found'];
                const isRowPending = pendingId === finding.id && isPending;

                return (
                  <tr key={finding.id} className="border-t border-[#1f2125]">
                    <td className="px-4 py-4 align-top">
                      {finding.url ? (
                        <a
                          href={finding.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-words text-[var(--wlm-yellow)] hover:underline"
                        >
                          {finding.url}
                        </a>
                      ) : (
                        <span className="text-[#9aa0a6]">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-[#cfd3da]">{finding.source_type ?? '—'}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-[#9aa0a6]">
                      {finding.created_at ? formatter.format(new Date(finding.created_at)) : '—'}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <CopyLinkButton url={finding.url} />
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              finding.id,
                              STATUS_PENDING,
                              approveAction,
                              'Finding approved. Takedown queued.'
                            )
                          }
                          disabled={isRowPending}
                          className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-[#0b0b0b] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              finding.id,
                              STATUS_REJECTED,
                              rejectAction,
                              'Finding marked as rejected.'
                            )
                          }
                          disabled={isRowPending}
                          className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-[#0b0b0b] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-40">
          <div
            className={`pointer-events-auto rounded-[18px] border px-4 py-3 text-sm shadow-[0_16px_40px_rgba(2,6,23,0.45)] transition ${
              toast.tone === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
