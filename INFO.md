# SmartQR — Project Info

## Identity
- **Domain**: https://smartqr.id
- **Admin email**: admin@smartqr.id
- **Supabase project**: `smartqr` (managed at supabase.com)

## Supabase
- **Project ref**: `ttsalrrkmqfgkolcflmk`
- **Project URL**: `https://ttsalrrkmqfgkolcflmk.supabase.co`
- **Database password**: `8rQxeJmEb3OSGYxl`
- **Service role key**: stored in `.env.local` (never commit)
- **Anon key**: `sb_publishable_e853Rzv-0g2IbJHdR_xqKQ_DzKAB2V1`
- **Database**: PostgreSQL

## Schema
- Run `supabase/schema.sql` after creating the project
- Tables: profiles, subscriptions, dynamic_codes, scan_events, scan_daily_summaries, tiers, custom_domains
- Storage bucket: `qr-codes`

## Stripe
- **Publishable key**: (from Stripe dashboard)
- **Secret key**: (from Stripe dashboard)
- **Webhook secret**: (from Stripe dashboard)
- **Price IDs needed**:
  - Starter: $9/mo (3 dynamic codes)
  - Growth: $19/mo (15 dynamic codes)

## Vercel
- Connect repo: `camloom32/smartqr` (or create new)
- Environment variables needed:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_STARTER_PRICE_ID`
  - `STRIPE_GROWTH_PRICE_ID`
  - `NEXT_PUBLIC_SITE_URL` (https://smartqr.id)

## Pricing
- Free: static QR codes only (no redirect server needed)
- Starter ($9/mo): 3 dynamic codes
- Growth ($19/mo): 15 dynamic codes
- Tier 3 (custom domains): deferred

## Key Files
- `src/lib/qrcode.ts` — QR generation with sharp logo overlay
- `src/lib/supabase/server.ts` — server-side Supabase client
- `src/app/c/[code]/route.ts` — redirect handler (checks subscription → redirect or expired)
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `src/app/dashboard/codes/new/page.tsx` — create QR code page
