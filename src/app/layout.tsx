import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartQR — QR codes built for business',
  description: 'Create stunning, customizable QR codes with real-time analytics. Unlimited scans, no penalties.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<Analytics /><SpeedInsights /></body>
    </html>
  )
}
