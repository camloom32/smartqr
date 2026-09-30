'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/database.types'

type Code = {
  id: string
  short_code: string
  destination_url: string
  title: string | null
  is_active: boolean
  created_at: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [codes, setCodes] = useState<Code[]>([])
  const [tier, setTier] = useState('free')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      const [codesResult, subResult] = await Promise.all([
        supabase.from('dynamic_codes').select('id, short_code, destination_url, title, is_active, created_at').eq('user_id', session.user.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('tier, status').eq('user_id', session.user.id).eq('status', 'active').single(),
      ])

      setCodes(codesResult.data || [])
      setTier(subResult.data?.tier || 'free')
      setLoading(false)
    }

    checkAuth()
  }, [])

  const copyToClipboard = async (shortCode: string) => {
    const url = `https://smartqr.id/c/${shortCode}`
    await navigator.clipboard.writeText(url)
    setCopiedCode(shortCode)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const codeCount = codes.length
  const maxCodes = tier === 'free' ? 0 : tier === 'starter' ? 3 : 15
  const canCreateMore = tier !== 'free' && codeCount < maxCodes

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {codeCount} code{codeCount !== 1 ? 's' : ''}
            {tier !== 'free' && ` · ${tier} plan (${maxCodes} max)`}
            {tier === 'free' && ' · Free plan'}
          </p>
        </div>
        <Link
          href="/dashboard/codes/new"
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
            canCreateMore
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Create New Code
        </Link>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No QR codes yet</p>
          {tier === 'free' && (
            <Link href="/pricing" className="text-blue-600 hover:underline text-sm font-medium">
              Upgrade to create dynamic QR codes
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {codes.map((code) => (
            <div key={code.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {code.title || 'Untitled'}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-3">{code.destination_url}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        smartqr.id/c/{code.short_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.short_code)}
                        className="text-gray-400 hover:text-gray-600 transition"
                        title="Copy URL"
                      >
                        {copiedCode === code.short_code ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="text-gray-400">Created {new Date(code.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Link
                      href={`/dashboard/codes/${code.id}/preview`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition"
                      title="Preview QR Code"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link
                    href={`/dashboard/codes/${code.id}`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
