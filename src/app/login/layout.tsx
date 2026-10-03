import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In | SmartQR',
  description: 'Log in to your SmartQR account to manage your QR codes, view analytics, and create new dynamic codes.',
  keywords: 'SmartQR login, QR code account',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
