'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ToolLinks from '@/components/ToolLinks'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Tier = {
  id: string
  name: string
  priceMonthly: string
  priceYearly: string
  description: string
  features: string[]
  cta: string
  checkout: string
  highlighted: boolean
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: '$0',
    priceYearly: '$0',
    description: 'For anyone getting started',
    features: [
      'Unlimited static QR codes',
      'Basic customization (colors)',
      'No analytics',
      'No dynamic editing',
    ],
    cta: 'Create QR codes',
    checkout: '',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: '$9',
    priceYearly: '$79',
    description: 'For individuals and small teams',
    features: [
      'Up to 3 active dynamic QR codes',
      'Unlimited scan counts',
      'Edit destination URLs anytime',
      'Full analytics dashboard',
      'Custom colors and frames',
      'Logo in QR center',
      'High-res SVG, PNG, PDF export',
      'No watermark',
    ],
    cta: 'Start free trial',
    checkout: 'starter',
    highlighted: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: '$19',
    priceYearly: '$159',
    description: 'For growing businesses',
    features: [
      'Up to 15 active dynamic QR codes',
      'Everything in Starter',
      'Bulk creation tools',
      '2–3 team seats',
      'Priority support',
    ],
    cta: 'Start free trial',
    checkout: 'growth',
    highlighted: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [currentTier, setCurrentTier] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  useEffect(() => {
    async function checkSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .maybeSingle()

      if (sub) {
        setCurrentTier(sub.tier)
        setCurrentStatus(sub.status)
      }
    }
    checkSubscription()
  }, [])

  async function handleCheckout(plan: string) {
    setLoading(plan + billing)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/signup?plan=${plan}`)
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, userId: user.id }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
        setLoading(null)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(null)
    }
  }

  function getButtonCta(tier: Tier) {
    if (tier.id === 'free') return { text: 'Create QR codes', href: '/create', disabled: false }
    if (currentTier === tier.id && currentStatus === 'active') {
      return { text: 'Current Plan', href: '/dashboard', disabled: true }
    }
    if (currentTier === 'growth' && tier.id === 'starter') {
      return { text: 'Downgrade', href: '#', disabled: true }
    }
    if (currentTier && currentTier !== 'free') {
      if (tier.id === 'starter' || (tier.id === 'growth' && currentTier === 'starter')) {
        return { text: 'Upgrade', href: '#', disabled: false, checkout: tier.checkout }
      }
    }
    return { text: tier.cta, href: '#', disabled: false, checkout: tier.checkout }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No scan caps. No hidden fees. No predatory overage charges.
              If your QR code goes viral, we celebrate your success.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  billing === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  billing === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 text-green-600 text-xs font-semibold">Save 50% off first year</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TIERS.map((tier) => {
              const btn = getButtonCta(tier)
              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl p-8 flex flex-col ${
                    tier.highlighted
                      ? 'border-2 border-blue-600 bg-blue-50 shadow-lg relative'
                      : 'border border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {billing === 'monthly' ? tier.priceMonthly : tier.priceYearly}
                    </span>
                    <span className="text-gray-500">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                    {billing === 'yearly' && tier.priceYearly !== '$0' && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${(parseInt(tier.priceMonthly.replace('$', '')) * 12 - parseInt(tier.priceYearly.replace('$', '')))}/year
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {'checkout' in btn && btn.checkout && !btn.disabled ? (
                    <button
                      onClick={() => handleCheckout(btn.checkout as string)}
                      disabled={loading === (btn.checkout as string) + billing}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                        tier.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      {loading === (btn.checkout as string) + billing ? 'Redirecting...' : btn.text}
                    </button>
                  ) : (
                    <span className={`block w-full py-3 px-4 rounded-xl font-semibold text-center ${
                      tier.highlighted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    } ${btn.disabled ? 'opacity-60' : ''}`}>
                      {btn.text}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mt-12">
            All plans include unlimited scan counts. You are never penalized for your own success.
          </p>
        </div>
      </section>
      <ToolLinks showUpgrade={false} />
    </div>
  )
}
