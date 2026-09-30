import Link from 'next/link'
import Header from '@/components/Header'
import ToolLinks from '@/components/ToolLinks'

const TIERS = [
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
    href: '/create',
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
    href: '/signup?plan=starter',
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
    href: '/signup?plan=growth',
    highlighted: false,
  },
]

export default function PricingPage() {
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

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-2xl p-8 ${
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
                  <span className="text-4xl font-bold text-gray-900">{tier.priceMonthly}</span>
                  <span className="text-gray-500">/month</span>
                  {tier.priceYearly !== '$0' && (
                    <p className="text-sm text-gray-500 mt-1">
                      or {tier.priceYearly}/year
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`block w-full text-center py-3 px-4 rounded-xl font-semibold transition ${
                    tier.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
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
