'use client';

import {useEffect, useMemo, useState} from 'react';
// @ts-expect-error: tipi forniti dal file ambientale in /types per build CI
import {useFormState} from 'react-dom';
import clsx from 'clsx';
import {initialNicknamesFormState, saveNicknamesAction} from './nicknamesActions';
import {useAppTranslations} from './TranslationsProvider';

type NicknamesFormProps = {
  initialNicknames: string[];
  actionPath: string;
  locale: string;
};

function sanitizeNicknames(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 4);
}

export default function NicknamesForm({initialNicknames, actionPath, locale}: NicknamesFormProps) {
  const t = useAppTranslations();
  const [state, formAction] = useFormState(saveNicknamesAction, initialNicknamesFormState);
  const [fields, setFields] = useState<string[]>(() => {
    const sanitized = sanitizeNicknames(initialNicknames);
    return sanitized.length ? sanitized : [''];
  });

  useEffect(() => {
    const sanitized = sanitizeNicknames(initialNicknames);
    setFields(sanitized.length ? sanitized : ['']);
  }, [initialNicknames]);

  const remainingSlots = useMemo(() => Math.max(0, 4 - fields.length), [fields.length]);

  const handleChange = (index: number, value: string) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddField = () => {
    setFields((prev) => {
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, ''];
    });
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => {
      if (prev.length === 1) {
        return [''];
      }
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : [''];
    });
  };

  const success = state.status === 'success';
  const error = state.status === 'error';

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="path" value={actionPath} />
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-3">
        {fields.map((value, index) => (
          <div key={`nickname-${index}`} className="flex items-center gap-3">
            <input
              type="text"
              name="nicknames"
              value={value}
              onChange={(event) => handleChange(index, event.target.value)}
              maxLength={80}
              placeholder={t('app.nicknames.form.placeholder')}
              className="flex-1 rounded-[12px] border border-[#2a2b2f] bg-[#121316] px-3 py-2 text-sm text-[var(--wlm-text)] shadow-inner shadow-[rgba(2,6,23,0.2)] focus:border-[var(--wlm-yellow)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleRemoveField(index)}
              className="rounded-full border border-[#2a2b2f] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#9aa0a6] transition hover:border-red-400 hover:text-red-300"
            >
              {t('app.nicknames.form.remove')}
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAddField}
          disabled={fields.length >= 4}
          className="rounded-full border border-[#2a2b2f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d9dce2] transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {remainingSlots > 0
            ? t('app.nicknames.form.addWithCount').replace('{count}', String(remainingSlots))
            : t('app.nicknames.form.limitReached')}
        </button>
        <button
          type="submit"
          className="rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#111] transition hover:bg-[#ffd600]"
        >
          {t('app.nicknames.form.submit')}
        </button>
        <span className="text-xs text-[#9aa0a6]">
          {t('app.nicknames.form.slotsUsed').replace('{count}', String(fields.length))}
        </span>
      </div>

      {state.message ? (
        <p
          className={clsx('text-xs', {
            'text-emerald-300': success,
            'text-red-300': error,
            'text-[#9aa0a6]': !success && !error
          })}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
