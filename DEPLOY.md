# SmartQR — Deployment Guide

## Overview

QR code SaaS platform at **https://smartqr.id** (domain registered by Cameron).

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — auth, database, storage
- **Stripe** — subscription payments
- **Vercel** — hosting

## Supabase Setup

1. Create a new Supabase project at supabase.com
2. Run the schema: paste `supabase/schema.sql` into the SQL Editor
3. Copy project URL and anon/public keys to `.env.local`
4. Add service role key as `SUPABASE_SERVICE_ROLE_KEY`

## Stripe Setup

1. Create a Stripe account
2. Create two subscription products:
   - **Starter** (e.g., $9/mo or $79/yr)
   - **Growth** (e.g., $19/mo or $159/yr)
3. Get the Price IDs and add to `.env.local`
4. Set up Stripe webhook pointing to `/api/webhooks/stripe` with events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://smartqr.id
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_GROWTH_PRICE_ID=price_...
```

## Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Key Routes

| Route | Purpose |
|-------|---------|
| `/c/[code]` | QR redirect handler (public) |
| `/dashboard` | Authenticated code list |
| `/dashboard/codes/new` | Create QR code |
| `/dashboard/analytics` | Scan analytics |
| `/api/codes` | Create/update QR codes |
| `/api/qr/preview` | Generate QR preview image |
| `/api/webhooks/stripe` | Stripe subscription events |

## Database Tables

- `profiles` — extends auth.users
- `subscriptions` — active subscriptions per user
- `dynamic_codes` — QR codes with short_code, destination_url
- `scan_events` — raw scan log (high-volume)
- `scan_daily_summaries` — rolled-up analytics
- `tiers` — plan definitions
- `custom_domains` — future: per-user custom domains

## Business Logic

- Free tier: static QR codes only (no redirect through SmartQR)
- Starter ($9/mo): 3 dynamic codes, analytics, logo
- Growth ($19/mo): 15 dynamic codes, bulk creation, team seats
- When subscription lapses, `/c/[code]` redirects to `/expired`
- Unlimited scans on all paid tiers (no caps)
