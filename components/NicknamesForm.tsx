'use client';

import {FormEvent, useEffect, useMemo, useState} from 'react';
import {supabaseBrowserClient} from '@/lib/supabase/client';

type ToastState =
  | {status: 'idle'}
  | {status: 'success'; message: string}
  | {status: 'error'; message: string};

const MAX_FIELDS = 4;

type NicknamesFormProps = {
  title?: string;
};

export default function NicknamesForm({title = 'Nicknames'}: NicknamesFormProps) {
  const supabase = useMemo(() => supabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [nicknames, setNicknames] = useState<string[]>(() => Array(MAX_FIELDS).fill(''));
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({status: 'idle'});

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!supabase) {
        setToast({status: 'error', message: 'Supabase non configurato'});
        return;
      }

      const {data, error} = await supabase.auth.getUser();
      if (!active) return;

      if (error || !data?.user) {
        setToast({status: 'error', message: 'Effettua l’accesso per salvare i nickname'});
        setUserId(null);
      } else {
        setUserId(data.user.id);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [supabase]);

  const handleChange = (index: number, value: string) => {
    setNicknames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast({status: 'idle'});

    if (!supabase) {
      setToast({status: 'error', message: 'Supabase non configurato'});
      return;
    }

    if (!userId) {
      setToast({status: 'error', message: 'Devi essere autenticato per salvare i nickname'});
      return;
    }

    const sanitized = nicknames.map((value) => value.trim()).filter((value) => value.length > 0);

    if (!sanitized.length) {
      setToast({status: 'error', message: 'Inserisci almeno un nickname valido'});
      return;
    }

    setLoading(true);

    const {error} = await supabase
      .from('nicknames')
      .insert(sanitized.map((value) => ({user_id: userId, value})));

    if (error) {
      setToast({status: 'error', message: `Salvataggio fallito: ${error.message}`});
    } else {
      setToast({status: 'success', message: 'Nickname salvati con successo'});
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-4 rounded-2xl border border-white/10 bg-[#121316] p-6 text-[var(--wlm-text)]">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-white/70">Aggiungi fino a quattro nickname o alias collegati al tuo profilo.</p>
      </header>

      <div className="space-y-3">
        {nicknames.map((value, index) => (
          <input
            key={`nickname-${index}`}
            type="text"
            maxLength={80}
            value={value}
            onChange={(event) => handleChange(index, event.target.value)}
            placeholder={`Nickname #${index + 1}`}
            className="w-full rounded-[12px] border border-[#2a2b2f] bg-[#0f1013] px-4 py-2 text-sm text-[var(--wlm-text)] transition focus:border-[var(--wlm-yellow)] focus:outline-none"
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Salvataggio…' : 'Salva nickname'}
      </button>

      {toast.status === 'success' ? (
        <p className="text-center text-sm text-emerald-300">{toast.message}</p>
      ) : null}
      {toast.status === 'error' ? <p className="text-center text-sm text-red-300">{toast.message}</p> : null}
    </form>
  );
}
