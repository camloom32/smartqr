import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free QR Code Analyzer | SmartQR',
  description: 'Check QR code scannability and contrast. Test your QR code before printing. Free contrast checker for any QR code.',
  keywords: 'QR code contrast checker, QR color analyzer, QR code scannability test, color contrast tool, free QR tool',
  alternates: { canonical: 'https://www.smartqr.id/analyze' },
  openGraph: {
    title: 'Free QR Code Analyzer',
    description: 'Check if your QR code is easily scannable. Free contrast and color analysis.',
  },
}

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
