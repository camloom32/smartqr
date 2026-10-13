import type { Metadata } from 'next'
import './globals.css'
import AnalyticsWrapper from '@/components/AnalyticsWrapper'

export const metadata: Metadata = {
  title: {
    default: 'SmartQR — QR codes built for business',
    template: '%s | SmartQR',
  },
  description: 'Create stunning, customizable QR codes with real-time analytics. Free static QR codes. Dynamic QR codes from $9/mo with scan tracking. Built for businesses.',
  keywords: 'QR code generator, dynamic QR codes, QR code analytics, QR code marketing, free QR codes, QR code creator, QR code maker',
  authors: [{ name: 'SmartQR' }],
  alternates: {
    canonical: 'https://www.smartqr.id',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.smartqr.id',
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
      <body className="antialiased">{children}<AnalyticsWrapper /></body>
    </html>
  )
}
