'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthComplete() {
  const router = useRouter()
  const [status, setStatus] = useState('Checking session...')

  useEffect(() => {
    const finishAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('Error: ' + error.message)
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      if (session) {
        setStatus('Session found! Redirecting to dashboard...')
        window.location.href = '/dashboard'
      } else {
        setStatus('No session found. Redirecting to login...')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    finishAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-lg text-gray-600">{status}</p>
      </div>
    </div>
  )
}
