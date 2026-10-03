import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartQR Dashboard',
  description: 'Manage your QR codes, view scan analytics, and create new dynamic codes.',
  keywords: 'QR dashboard, QR code management',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
