import fs from 'node:fs/promises';
import path from 'node:path';

type PageProps = {
  params: {locale: 'it' | 'en'};
};

export const dynamic = 'force-static';

async function loadMigration() {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '001_init.sql');

  try {
    return await fs.readFile(migrationPath, 'utf8');
  } catch {
    return '-- Migration file not found. Ensure supabase/migrations/001_init.sql exists.';
  }
}

export default async function MigrationsPage({params: {locale}}: PageProps) {
  const sql = await loadMigration();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12 text-[var(--wlm-text)]">
      <h1 className="text-3xl font-extrabold">Database migration</h1>
      <p className="text-sm text-[#cfd3da]">
        Run the SQL below inside your Supabase SQL editor or CLI against the{' '}
        <code className="rounded bg-[#1f2125] px-1 py-0.5 text-xs text-[var(--wlm-yellow)]">
          public
        </code>{' '}
        schema. Execute each migration once, starting with <strong>001_init.sql</strong>. After
        running the script, refresh this page and sign in to verify that your profile can read and
        write data.
      </p>
      <p className="text-sm text-[#cfd3da]">
        Current locale: <span className="font-semibold uppercase text-[var(--wlm-yellow)]">{locale}</span>
      </p>
      <pre className="overflow-x-auto rounded-[18px] border border-[#1f2125] bg-[#0f1013] p-6 text-xs leading-relaxed text-[#cfd3da]">
        {sql}
      </pre>
    </div>
  );
}
