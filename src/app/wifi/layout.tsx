import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free WiFi QR Code Generator | SmartQR',
  description: 'Generate a QR code that guests can scan to connect to your WiFi. No password sharing needed. Supports WPA, WEP, and open networks. Free download.',
  keywords: 'WiFi QR code generator, WiFi QR code, QR code for WiFi, share WiFi password, guest WiFi, free WiFi QR',
  openGraph: {
    title: 'Free WiFi QR Code Generator',
    description: 'Let guests connect to your WiFi by scanning a QR code. Works with any device.',
  },
}

export default function WifiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
