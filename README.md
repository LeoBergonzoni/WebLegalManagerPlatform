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
