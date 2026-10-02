import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PRICE_IDS: Record<string, string> = {
  'starter-monthly': process.env.STRIPE_STARTER_PRICE_ID!,
  'starter-yearly': process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
  'growth-monthly': process.env.STRIPE_GROWTH_PRICE_ID!,
  'growth-yearly': process.env.STRIPE_GROWTH_YEARLY_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const priceKey = `${plan}-${billing}`
    const priceId = PRICE_IDS[priceKey]

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, tier, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (existingSub) {
      return NextResponse.json({ error: 'You already have an active subscription. Manage it from your dashboard.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: profile?.email || undefined,
      metadata: { userId, plan, billing },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      subscription_data: {
        metadata: { userId, plan, billing },
        trial_period_days: 14,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
