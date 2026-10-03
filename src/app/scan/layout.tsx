import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free QR Code Scanner | SmartQR',
  description: 'Scan any QR code instantly using your camera. No app download required. Free browser-based QR reader works on any device.',
  keywords: 'QR code scanner, free QR scanner, QR reader, scan QR code, QR code decoder, browser QR scanner',
  openGraph: {
    title: 'Free QR Code Scanner',
    description: 'Scan any QR code instantly with your camera. No app needed. Free and private.',
  },
}

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
