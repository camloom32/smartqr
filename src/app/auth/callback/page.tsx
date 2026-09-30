'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleHashSession = async () => {
      const hash = window.location.hash

      if (hash && hash.includes('access_token')) {
        setStatus('Found token, logging in...')

        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (!accessToken) {
          setError('Access token missing from URL')
          return
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          setError(sessionError.message)
          return
        }

        window.location.href = '/dashboard'
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        if (authError || !user) {
          setError(authError?.message || 'auth_failed')
          return
        }

        window.location.href = '/dashboard'
        return
      }

      setError('no_auth_data')
    }

    handleHashSession()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Link href="/" className="block mb-6">
          <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto mx-auto" />
        </Link>
        {error ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
          </div>
        ) : (
          <p className="text-lg text-gray-600">{status}</p>
        )}
      </div>
    </div>
  )
}
