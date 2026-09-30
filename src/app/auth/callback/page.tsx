'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const handleCallback = async () => {
      const hash = window.location.hash

      if (hash && hash.includes('access_token')) {
        setStatus('Session found! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !user) {
          setStatus('Error: ' + (error?.message || 'auth_failed'))
          return
        }

        setStatus('Session created! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
        return
      }

      setStatus('No auth data found')
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Link href="/" className="block mb-6">
          <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto mx-auto" />
        </Link>
        <p className="text-lg text-gray-600">{status}</p>
      </div>
    </div>
  )
}
