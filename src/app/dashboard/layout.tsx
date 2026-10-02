'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [billingLoading, setBillingLoading] = useState(false)
  const [isGrowth, setIsGrowth] = useState(false)

  useEffect(() => {
    async function checkTier() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

      if (sub?.tier === 'growth') {
        setIsGrowth(true)
      }
    }
    checkTier()
  }, [])

  async function handleManageBilling() {
    setBillingLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Portal error:', data.error)
        setBillingLoading(false)
      }
    } catch (err) {
      alert('Could not open billing portal. Please contact support.')
      setBillingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              My Codes
            </Link>
            {isGrowth && (
              <Link href="/dashboard/team" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Team
              </Link>
            )}
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {billingLoading ? 'Loading...' : 'Manage Billing'}
            </button>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
