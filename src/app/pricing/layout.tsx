import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | SmartQR — QR codes built for business',
  description: 'Simple, transparent pricing. Free forever for static QR codes. Starter at $9/mo for dynamic codes with analytics. Growth at $19/mo for teams. No hidden fees.',
  keywords: 'QR code pricing, QR code subscription, dynamic QR codes, QR analytics, QR code plans',
  openGraph: {
    title: 'SmartQR Pricing',
    description: 'Free static QR codes. Dynamic codes from $9/mo with real-time analytics.',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
