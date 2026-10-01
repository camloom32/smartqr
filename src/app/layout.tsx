import type { Metadata } from 'next'
import './globals.css'
import '@vercel/analytics'

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
      <body className="antialiased">{children}</body>
    </html>
  )
}
