import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | SmartQR',
  description: 'Create your free SmartQR account. Start with static QR codes and upgrade anytime for dynamic codes, analytics, and team features.',
  keywords: 'SmartQR signup, create QR account',
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
