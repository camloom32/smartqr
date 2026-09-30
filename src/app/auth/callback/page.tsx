'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      if (session) {
        router.push('/dashboard')
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' || session) {
            router.push('/dashboard')
          }
        })
        return () => subscription.unsubscribe()
      }
    }

    handleAuth()
  }, [router])

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
          <p className="text-lg text-gray-600">Completing sign in...</p>
        )}
      </div>
    </div>
  )
}
