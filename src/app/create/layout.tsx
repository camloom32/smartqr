import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free QR Code Generator | SmartQR',
  description: 'Create free static QR codes instantly. No signup required. Customize colors, styles, and frames. Instant download as PNG or SVG.',
  keywords: 'free QR code generator, QR code creator, static QR code, QR code PNG, QR code SVG, QR code download, free QR tool',
  openGraph: {
    title: 'Free QR Code Generator',
    description: 'Create static QR codes for free. No signup needed. Customize colors and download instantly.',
  },
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
