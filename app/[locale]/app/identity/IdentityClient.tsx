'use client';

import {useEffect, useState} from 'react';
import {useMemo} from 'react';
import type {DragEvent, ChangeEvent} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseBrowserClient} from '@/lib/supabase/client';

type IdentityRecord = {
  id: string;
  doc_type: string | null;
  doc_url: string | null;
  status: string | null;
  verified_at: string | null;
};

type IdentityClientProps = {
  authUserId: string;
  profileId: string;
  identity: IdentityRecord | null;
};

const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

const docTypeOptions = [
  {value: 'passport', label: 'Passport'},
  {value: 'id_card', label: 'ID Card'},
  {value: 'driver_license', label: 'Driver License'},
  {value: 'unknown', label: 'Unknown'}
];

export default function IdentityClient({authUserId, profileId, identity}: IdentityClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowserClient(), []);
  const [bucketStatus, setBucketStatus] = useState<{ok: boolean; message: string}>(() => ({
    ok: false,
    message: ''
  }));
  const storageReady = Boolean(supabase) && bucketStatus.ok;
  const storageUnavailable = !storageReady;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>(identity?.doc_type ?? 'passport');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verifyBucket() {
      try {
        if (!supabase) return;
        const {error: bucketError} = await supabase.storage.from('ids').list('', {limit: 1});
        if (cancelled) {
          return;
        }
        if (bucketError) {
          console.error('[identity] bucket check failed', bucketError);
          setBucketStatus({ok: false, message: 'Bucket "ids" non accessibile. Verifica policies.'});
        } else {
          setBucketStatus({ok: true, message: ''});
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[identity] bucket check exception', err);
        setBucketStatus({ok: false, message: 'Errore durante la verifica del bucket.'});
      }
    }

    verifyBucket();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(null);
    return () => {};
  }, [file]);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleFiles = (selected: FileList | null) => {
    resetMessages();
    if (!selected || selected.length === 0) {
      return;
    }

    const nextFile = selected[0];
    if (!allowedTypes.includes(nextFile.type)) {
      setError('Unsupported file type. Upload PNG, JPG, or PDF.');
      return;
    }

    if (nextFile.size > maxFileSize) {
      setError('File is larger than 10MB. Please upload a smaller document.');
      return;
    }

    setFile(nextFile);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer?.files ?? null);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleUpload = async () => {
    resetMessages();

    if (!file) {
      setError('Select a document before saving.');
      return;
    }

    if (!storageReady || !supabase) {
      setError(bucketStatus.message || 'Storage not configured. Please contact support.');
      return;
    }

    setUploading(true);

    const fileNameSafe = file.name.replace(/\s+/g, '-');
    const objectPath = `${authUserId}/${Date.now()}-${fileNameSafe}`;

    try {
      const storageClient = supabase.storage.from('ids');
      const {error: uploadError} = await storageClient.upload(objectPath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

      if (uploadError) {
        const statusCode = (uploadError as {statusCode?: number}).statusCode ?? null;
        const messageLower = uploadError.message.toLowerCase();
        const misconfigured =
          (statusCode && [401, 403, 404].includes(statusCode)) ||
          messageLower.includes('bucket not found') ||
          messageLower.includes('not authorized');

        if (misconfigured) {
          setBucketStatus({ok: false, message: 'Storage non configurato. Contatta il supporto.'});
          setError('Storage not configured. Please contact support.');
        } else {
          setError(`Upload failed: ${uploadError.message}`);
        }
        setUploading(false);
        return;
      }

      const {data: publicUrlData} = storageClient.getPublicUrl(objectPath);
      const docUrl = publicUrlData.publicUrl;

      let dbError;
      if (identity?.id) {
        const {error} = await supabase
          .from('identities')
          .update({
            doc_type: docType,
            doc_url: docUrl,
            status: 'submitted',
            verified_at: null
          })
          .eq('id', identity.id)
          .eq('user_id', profileId);
        dbError = error;
      } else {
        const {error} = await supabase.from('identities').insert({
          user_id: profileId,
          doc_type: docType,
          doc_url: docUrl,
          status: 'submitted',
          verified_at: null
        });
        dbError = error;
      }

      if (dbError) {
        setError(`Could not save identity record: ${dbError.message}`);
        setUploading(false);
        return;
      }

      setInfo('Document uploaded successfully. Status: pending review.');
      setFile(null);
      setPreviewUrl(null);
      setUploading(false);
      router.refresh();
    } catch (err) {
      console.error('[identity] upload exception', err);
      setError('Unexpected error while uploading document.');
      setUploading(false);
    }
  };

  if (!storageReady) {
    return (
      <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
        {bucketStatus.message || 'Storage non configurato o sessione non inizializzata. Riprova più tardi.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {storageUnavailable ? (
        <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-200">
          {bucketStatus.message || 'Storage not configured'}
        </div>
      ) : null}
      <div>
        <label className="block text-sm font-semibold text-[var(--wlm-text)]">Document type</label>
        <select
          value={docType}
          onChange={(event) => setDocType(event.target.value)}
          className="mt-2 w-full rounded-md border border-[#2a2b2f] bg-[#0f1013] px-3 py-2 text-sm text-[var(--wlm-text)] focus:border-[var(--wlm-yellow)] focus:outline-none"
        >
          {docTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-[#2a2b2f] bg-[#0f1013] px-6 py-10 text-center transition hover:border-[var(--wlm-yellow)] hover:text-[var(--wlm-yellow)]"
      >
        <span className="text-sm font-semibold text-[var(--wlm-text)]">
          Drag & drop your document or click to browse
        </span>
        <span className="text-xs text-[#cfd3da]">
          Accepted formats: PNG, JPG, PDF &middot; Max size 10MB
        </span>
        <input type="file" accept={allowedTypes.join(',')} className="hidden" onChange={onFileChange} />
      </label>

      {file ? (
        <div className="rounded-[18px] border border-[#1f2125] bg-[#0f1013] p-4 text-sm text-[#cfd3da]">
          <p className="font-semibold text-[var(--wlm-text)]">Selected file</p>
          <p>{file.name}</p>
          <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Document preview"
              className="mt-3 max-h-64 w-full rounded-md object-contain"
            />
          ) : null}
        </div>
      ) : null}

      {!file && identity?.doc_url ? (
        <div className="rounded-[18px] border border-[#1f2125] bg-[#0f1013] p-4 text-sm text-[#cfd3da]">
          <p className="font-semibold text-[var(--wlm-text)]">Current document</p>
          {identity.doc_url.toLowerCase().includes('.pdf') ? (
            <a
              href={identity.doc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-[var(--wlm-yellow)] underline"
            >
              View uploaded PDF
            </a>
          ) : (
            <img
              src={identity.doc_url}
              alt="Uploaded document"
              className="mt-3 max-h-64 w-full rounded-md object-contain"
            />
          )}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {info ? <p className="text-sm text-[var(--wlm-yellow)]">{info}</p> : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || storageUnavailable}
        className="w-full rounded-full bg-[var(--wlm-yellow)] px-4 py-2 text-sm font-semibold text-[#111] transition hover:bg-[#ffd600] disabled:opacity-60"
      >
        {uploading ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
