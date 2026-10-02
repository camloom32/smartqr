'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function ClaimInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function claimInvite() {
      if (!token) {
        setError('Invalid invite link')
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push(`/login?redirect=/dashboard/team/claim?token=${token}`)
        return
      }

      const res = await fetch(`/api/team/claim?token=${token}`)
      const data = await res.json()

      if (!res.ok || !data.teamMemberId) {
        setError(data.error || 'Invalid invite link')
        setLoading(false)
        return
      }

      if (data.memberEmail.toLowerCase() !== session.user.email?.toLowerCase()) {
        setError(`This invite was sent to ${data.memberEmail}. Please sign in with that email address.`)
        setLoading(false)
        return
      }

      const claimRes = await fetch('/api/team/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
        body: JSON.stringify({ teamMemberId: data.teamMemberId }),
      })

      if (claimRes.ok) {
        router.push('/dashboard?claimed=true')
      } else {
        const claimData = await claimRes.json()
        setError(claimData.error || 'Failed to accept invite')
        setLoading(false)
      }
    }

    claimInvite()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Accepting invite...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/dashboard" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return null
}

export default function ClaimInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ClaimInviteContent />
    </Suspense>
  )
}
