'use client';

import {useFormState, useFormStatus} from 'react-dom';
import {useEffect} from 'react';

export type NewFindingFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export const initialFormState: NewFindingFormState = {
  status: 'idle'
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type NewFindingFormProps = {
  users: UserOption[];
  action: (state: NewFindingFormState, formData: FormData) => Promise<NewFindingFormState>;
};

function SubmitButton() {
  const {pending} = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Create finding'}
    </button>
  );
}

export default function NewFindingForm({users, action}: NewFindingFormProps) {
  const [state, formAction] = useFormState(action, initialFormState);

  useEffect(() => {
    if (state.status === 'success') {
      const form = document.getElementById('admin-new-finding-form') as HTMLFormElement | null;
      form?.reset();
    }
  }, [state.status]);

  if (!users.length) {
    return (
      <div className="rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 text-sm text-[#cfd3da] shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        No users found. Create an account first, then return here to attach findings.
      </div>
    );
  }

  return (
    <form
      id="admin-new-finding-form"
      action={formAction}
      className="space-y-5 rounded-[20px] border border-[#1f2125] bg-[#121316] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
    >
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d939f]" htmlFor="user_id">
          Assign to user
        </label>
        <select
          id="user_id"
          name="user_id"
          required
          className="w-full rounded-[14px] border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-sm text-[#cfd3da] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
          defaultValue={users[0]?.id ?? ''}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — {user.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d939f]" htmlFor="url">
          URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://example.com/infringing-content"
          className="w-full rounded-[14px] border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-sm text-[#cfd3da] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d939f]" htmlFor="source_type">
          Source type
        </label>
        <select
          id="source_type"
          name="source_type"
          required
          className="w-full rounded-[14px] border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-sm text-[#cfd3da] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
          defaultValue="search"
        >
          <option value="search">Search</option>
          <option value="host">Host</option>
          <option value="social">Social</option>
          <option value="marketplace">Marketplace</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d939f]" htmlFor="note">
          Note (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          placeholder="Add context for the legal team..."
          className="w-full rounded-[14px] border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-sm text-[#cfd3da] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
        />
      </div>

      <SubmitButton />

      {state.status === 'success' ? (
        <p className="rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {state.message ?? 'Finding created successfully.'}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {state.message ?? 'Unable to create the finding. Please try again.'}
        </p>
      ) : null}
    </form>
  );
}
