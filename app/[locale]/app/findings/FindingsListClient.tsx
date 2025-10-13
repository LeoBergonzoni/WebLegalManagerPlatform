'use client';

import {useMemo, useOptimistic, useState, useTransition, useEffect} from 'react';

type Finding = {
  id: string;
  url: string;
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
};

const statusStyles: Record<string, string> = {
  Found: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  Pending: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  Submitted: 'bg-blue-500/15 text-blue-200 border border-blue-500/30',
  Removed: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  Rejected: 'bg-red-500/15 text-red-200 border border-red-500/30'
};

const STATUS_PENDING = 'Pending';
const STATUS_REJECTED = 'Rejected';

export default function FindingsListClient({findings, locale, approveAction, rejectAction}: FindingsListClientProps) {
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

  const setOptimisticStatus = (id: string, status: string) => {
    applyOptimistic({id, status});
  };

  const revertStatus = (id: string, previousStatus: string | null | undefined) => {
    applyOptimistic({id, status: previousStatus ?? 'Found'});
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

  return (
    <div className="space-y-4">
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
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#cfd3da]">
                  No findings yet. Once content is flagged, it will appear here for your approval.
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
                      <a
                        href={finding.url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-words text-[var(--wlm-yellow)] hover:underline"
                      >
                        {finding.url ?? 'Unknown'}
                      </a>
                    </td>
                    <td className="px-4 py-4 align-top text-[#cfd3da]">
                      {finding.source_type ?? '—'}
                    </td>
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
        <div
          className={`rounded-[18px] border px-4 py-3 text-sm shadow transition ${
            toast.tone === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
