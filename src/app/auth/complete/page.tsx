'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthComplete() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        setStatus('Session not found. Please try signing in again.')
        return
      }

      window.location.href = '/dashboard'
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Link href="/">
          <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="mx-auto mb-8 h-10 w-auto" />
        </Link>
        <p className="text-lg text-gray-600">{status}</p>
        <p className="text-sm text-gray-400 mt-2">If nothing happens, <Link href="/login" className="text-blue-600 hover:underline">click here</Link>.</p>
      </div>
    </div>
  )
}
