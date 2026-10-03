import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free QR Code Color Contrast Analyzer | SmartQR',
  description: 'Test your QR code color contrast for scannability. Free tool checks foreground/background color combinations and scores scanability before you create QR codes.',
  keywords: 'QR code contrast checker, QR color analyzer, QR code scannability test, color contrast tool, free QR tool',
  openGraph: {
    title: 'Free QR Code Color Contrast Analyzer',
    description: 'Test your QR code color contrast for maximum scannability. Free instant analysis.',
  },
}

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
