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
      console.log('Callback URL:', window.location.href)
      console.log('Hash:', hash)

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
          console.error('setSession error:', sessionError)
          setError('setSession failed: ' + sessionError.message)
          return
        }

        window.location.href = '/dashboard'
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      console.log('Code:', code)

      if (code) {
        setStatus('Exchanging code...')
        const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        console.log('exchangeCodeForSession result:', data, authError)

        if (authError) {
          console.error('Code exchange error:', authError)
          setError('Code exchange failed: ' + authError.message)
          return
        }

        if (!data?.session) {
          setError('No session returned')
          return
        }

        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        })

        window.location.href = '/dashboard'
        return
      }

      setError('no_auth_data')
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
