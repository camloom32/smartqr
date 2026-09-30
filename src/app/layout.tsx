import type { Metadata } from 'next'
import './globals.css'
import AuthHandler from '@/components/AuthHandler'

export const metadata: Metadata = {
  title: 'SmartQR — QR codes built for business',
  description: 'Create stunning, customizable QR codes with real-time analytics. Unlimited scans, no penalties.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <AuthHandler />
      </body>
    </html>
  )
}
