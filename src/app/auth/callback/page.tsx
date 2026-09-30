'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleHashSession = async () => {
      const hash = window.location.hash
      console.log('Hash in URL:', hash)

      if (hash && hash.includes('access_token')) {
        console.log('Found access token in hash')
        setStatus('Found token, logging in...')

        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (!accessToken) {
          setError('Access token missing from URL')
          return
        }

        console.log('Calling setSession...')
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          console.error('setSession error:', sessionError)
          setError(sessionError.message)
          return
        }

        console.log('Session set! Redirecting to dashboard...')
        window.location.href = '/dashboard'
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      console.log('Code in URL:', code)

      if (code) {
        console.log('Exchanging code for session...')
        const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        if (authError || !user) {
          console.error('Code exchange error:', authError)
          setError(authError?.message || 'auth_failed')
          return
        }

        console.log('Code exchanged! Redirecting to dashboard...')
        window.location.href = '/dashboard'
        return
      }

      console.log('No auth data found in URL')
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
