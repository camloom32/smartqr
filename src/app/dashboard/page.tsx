'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import type { Database } from '@/lib/supabase/database.types'

type Code = Database['public']['Tables']['dynamic_codes']['Row']

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [codes, setCodes] = useState<any[]>([])
  const [tier, setTier] = useState('free')
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      const [codesResult, subResult] = await Promise.all([
        supabase.from('dynamic_codes').select('id, short_code, destination_url, title, is_active, created_at').eq('user_id', session.user.id).eq('is_active', true),
        supabase.from('subscriptions').select('tier, status').eq('user_id', session.user.id).eq('status', 'active').single(),
      ])

      setCodes(codesResult.data || [])
      setTier(subResult.data?.tier || 'free')
      setLoading(false)
    }

    checkAuth()
  }, [])

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
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Create New Code
        </Link>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-500 mb-4">No QR codes yet</p>
          {tier === 'free' && (
            <Link href="/pricing" className="text-blue-600 hover:underline text-sm">
              Upgrade to create dynamic QR codes
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Short Code</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Destination</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{code.title || 'Untitled'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{code.short_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{code.destination_url}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{new Date(code.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
