'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

function CallbackContent() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorParam = params.get('error')

      if (errorParam) {
        setError(errorParam)
        return
      }

      if (!code) {
        setError('no_code')
        return
      }

      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError || !user) {
        setError('auth_failed')
        return
      }

      window.location.href = '/dashboard'
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Authentication failed: {error}</p>
        <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-lg text-gray-600">Completing sign in...</p>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Link href="/" className="block mb-6">
          <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto mx-auto" />
        </Link>
        <CallbackContent />
      </div>
    </div>
  )
}
