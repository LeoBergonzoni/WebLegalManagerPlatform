# Web Legal Manager Platform

This repository contains the Next.js landing experience for Web Legal Manager, built with Tailwind CSS and next-intl.

## Build & Deploy

- Install dependencies: `npm install` (requires Node 18+).
- Local preview: `npm run dev` then visit the locale-prefixed homepage (e.g. http://localhost:3000/it).
- Production build: `npm run build` and `npm start` to smoke-test the output locally.
- Netlify setup:
  - Build command: `npm run build`
  - Publish directory: `.next`
  - Add environment variable `NEXT_PUBLIC_SITE_URL` with the production domain (used for sitemap generation).
  - Optionally run `npm run sitemap` post-build to refresh XML sitemaps.

## Supabase Setup

- Create a new Supabase project and copy the project URL and anon key from **Project Settings → API**.
- Duplicate `.env.example` to `.env.local`, then paste:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (required by Stripe webhooks to update billing fields)
  - `ADMIN_EMAILS` (optional list enabling manual verification button in `/app/identity`).
- In Supabase Storage, create a bucket named `ids` (standard bucket). Add a policy so authenticated users can upload and read their own files, for example:
  ```sql
  create policy "Allow authenticated uploads" on storage.objects
    for insert with check (
      bucket_id = 'ids' and auth.uid() = owner
    );

  create policy "Allow authenticated read" on storage.objects
    for select using (
      bucket_id = 'ids' and auth.uid() = owner
    );
  ```
- In Netlify, add the same variables under Site Settings → Build & deploy → Environment so production builds can reach Supabase.
- Run the SQL in `supabase/migrations/001_init.sql` once via the Supabase SQL editor or CLI to create tables and RLS policies.
- Apply subsequent migrations in order (`002_billing.sql`, etc.) to keep the schema aligned with new features.
- After deploying, visit `/{locale}/admin/migrations` (e.g. `/it/admin/migrations`) to review migrations and confirm they have been executed.

## Stripe Setup

- Set the following environment variables locally and in Netlify:
  - `NEXT_PUBLIC_SITE_URL`
  - `STRIPE_PUBLIC_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_STARTER`
  - `STRIPE_PRICE_PRO`
  - `STRIPE_WEBHOOK_SECRET`
- Create two subscription prices in Stripe (Starter €49/mo, Pro €149/mo) and paste their price IDs in the env vars above.
- Configure a webhook endpoint pointing to `<your-site>/api/webhooks/stripe` and subscribe to `checkout.session.completed` plus `customer.subscription.updated`.
- Once configured, the pricing buttons will redirect users to Stripe Checkout; missing keys automatically disable the buttons.

## i18n & Routing

- Translations live in `messages/it.json` and `messages/en.json`. Add new keys to both files and consume them with `useTranslations('namespace')` or plain `useTranslations()` in components.
- The middleware (`middleware.ts`) forces locale-prefixed routes, so `/it/...` and `/en/...` are automatically resolved and non-prefixed requests redirect to the default Italian locale.

## Roadmap

- **MVP**
  - Polish the bilingual landing experience (IT/EN) and monitor the conversion funnel.
  - Capture contact leads via embedded form or contact link.
  - Verify responsive layout and cross-browser compatibility.
  - Set up analytics (e.g., Netlify Analytics or Google Analytics).
- **V1**
  - Expand sections with product features, pricing, and testimonials.
  - Add blog/news updates sourced from a headless CMS.
  - Integrate CRM for automated lead capture and follow-up.
  - Launch authenticated dashboard MVP once backend is ready.
