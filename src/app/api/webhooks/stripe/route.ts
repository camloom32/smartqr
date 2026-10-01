import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSubscriptionDates(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
    current_period_start: number
    current_period_end: number
    status: string
    items: { data: Array<{ price: { id: string } }> }
  }
  return {
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    status: sub.status,
    price_id: sub.items.data[0].price.id,
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) break

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

        if (!subscriptionId) break

        const dates = await getSubscriptionDates(subscriptionId)
        const tier = plan === 'starter' ? 'starter' : plan === 'growth' ? 'growth' : 'free'

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer as string,
          stripe_price_id: dates.price_id,
          tier,
          status: dates.status,
          current_period_start: dates.current_period_start,
          current_period_end: dates.current_period_end,
        }, { onConflict: 'user_id' })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as unknown as {
          id: string
          metadata: Record<string, string>
        }
        const userId = subscription.metadata?.userId

        if (!userId) break

        const dates = await getSubscriptionDates(subscription.id)
        const tier = subscription.metadata?.plan === 'starter' ? 'starter'
          : subscription.metadata?.plan === 'growth' ? 'growth'
          : 'free'

        await supabaseAdmin.from('subscriptions').update({
          status: dates.status,
          tier,
          stripe_price_id: dates.price_id,
          current_period_start: dates.current_period_start,
          current_period_end: dates.current_period_end,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { id: string }

        await supabaseAdmin.from('subscriptions').update({
          status: 'canceled',
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as { subscription?: string | null }
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null

        if (!subscriptionId) break

        const dates = await getSubscriptionDates(subscriptionId)
        await supabaseAdmin.from('subscriptions').update({
          status: dates.status,
          current_period_start: dates.current_period_start,
          current_period_end: dates.current_period_end,
        }).eq('stripe_subscription_id', subscriptionId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription?: string | null }
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null

        if (!subscriptionId) break

        await supabaseAdmin.from('subscriptions').update({
          status: 'past_due',
        }).eq('stripe_subscription_id', subscriptionId)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
