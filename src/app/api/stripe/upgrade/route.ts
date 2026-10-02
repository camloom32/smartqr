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
    const newPriceId = PRICE_IDS[priceKey]

    if (!newPriceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, tier')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const currentSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const currentItemId = currentSub.items.data[0].id

    const updatedSub = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: 'always_invoice',
    })

    const tier = plan === 'starter' ? 'starter' : 'growth'

    await supabase.from('subscriptions').update({
      tier,
      stripe_price_id: newPriceId,
      status: updatedSub.status,
    }).eq('stripe_subscription_id', subscription.stripe_subscription_id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
