'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash

      if (hash && hash.includes('access_token')) {
        setStatus('Session established!')

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          setError('Failed to get session')
          return
        }

        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorParam = params.get('error')

      if (errorParam) {
        setError(errorParam)
        return
      }

      if (code) {
        const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        if (authError || !user) {
          setError('auth_failed')
          return
        }

        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
        return
      }

      setError('no_session')
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Link href="/" className="block mb-6">
          <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto mx-auto" />
        </Link>
        {error ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">Auth failed: {error}</p>
            <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
          </div>
        ) : (
          <p className="text-lg text-gray-600">{status}</p>
        )}
      </div>
    </div>
  )
}
