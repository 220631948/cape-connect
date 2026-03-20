---
name: 'Next.js 15 App Router'
description: 'Next.js 15 App Router conventions and patterns'
applyTo: '**/app/**/*.ts,**/app/**/*.tsx'
---

# Next.js 15 App Router Standards

- Use the App Router (`app/` directory), NOT the Pages Router.
- Server Components are the default. Mark client components explicitly with `'use client'`.
- MapLibre GL JS requires `window` and WebGL — always load via `next/dynamic({ ssr: false })`.
- Use `generateMetadata()` for SEO on every page.
- Route handlers go in `app/api/` with `route.ts` files.
- Use Next.js middleware (`middleware.ts`) for tenant resolution from subdomain/custom domain.
- Prefer Server Actions for mutations when possible.
- Use `loading.tsx` and `error.tsx` for route-level loading/error states.
- Environment variables: prefix with `NEXT_PUBLIC_` only for client-side values.
