import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price?.id
      const periodStart = sub.items.data[0]?.current_period_start
      const periodEnd = sub.items.data[0]?.current_period_end

      // Map price ID to tier
      let tier: 'free' | 'starter' | 'growth' = 'free'
      if (priceId === process.env.STRIPE_STARTER_PRICE_ID) tier = 'starter'
      if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) tier = 'growth'

      // Find user by stripe customer id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) break

      await supabase.from('subscriptions').upsert({
        user_id: profile.id,
        tier,
        status: sub.status as any,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) break

      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', profile.id)
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const customerId = session.customer as string
      const userId = session.metadata?.user_id
      if (!userId) break

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
