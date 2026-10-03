import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SmartQR — QR codes built for business',
    template: '%s | SmartQR',
  },
  description: 'Create stunning, customizable QR codes with real-time analytics. Free static QR codes. Dynamic QR codes from $9/mo with scan tracking. Built for businesses.',
  keywords: 'QR code generator, dynamic QR codes, QR code analytics, QR code marketing, free QR codes, QR code creator, QR code maker',
  authors: [{ name: 'SmartQR' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smartqr.id',
    siteName: 'SmartQR',
    title: 'SmartQR — QR codes built for business',
    description: 'Create stunning, customizable QR codes with real-time analytics. Free static codes. Dynamic codes from $9/mo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartQR — QR codes built for business',
    description: 'Create stunning, customizable QR codes with real-time analytics.',
  },
  icons: {
    icon: '/favicon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
