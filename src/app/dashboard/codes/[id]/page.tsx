'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

type ScanSummary = {
  total_scans: number
  unique_visitors: number
  today_scans: number
  this_week: number
  this_month: number
}

export default function CodeDetailPage() {
  const params = useParams()
  const codeId = params.id as string

  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState<any>(null)
  const [stats, setStats] = useState<ScanSummary | null>(null)
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [qrImage, setQrImage] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'scans'>('overview')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: codeData } = await supabase
        .from('dynamic_codes')
        .select('*')
        .eq('id', codeId)
        .eq('user_id', session.user.id)
        .single()

      if (!codeData) {
        window.location.href = '/dashboard'
        return
      }

      setCode(codeData)

      const style = codeData.style_json || {}
      const fg = encodeURIComponent(style.foregroundColor || '#000000')
      const bg = encodeURIComponent(style.backgroundColor || '#ffffff')
      const logoParam = style.logo ? `&logo=${encodeURIComponent(style.logo)}` : ''

      const [summaryResult, scansResult] = await Promise.all([
        supabase.rpc('get_scan_summary', { code_id_param: codeId }),
        supabase.from('scan_events').select('*').eq('code_id', codeId).order('created_at', { ascending: false }).limit(20),
      ])

      if (summaryResult.data) {
        setStats(summaryResult.data)
      } else {
        setStats({ total_scans: 0, unique_visitors: 0, today_scans: 0, this_week: 0, this_month: 0 })
      }

      setRecentScans(scansResult.data || [])
      setLoading(false)

      const qrRes = await fetch(`/api/qr/preview?url=${encodeURIComponent(`https://smartqr.id/c/${codeData.short_code}`)}&fg=${fg}&bg=${bg}${logoParam}`)
      const qrData = await qrRes.json()
      setQrImage(qrData.png || '')
    }

    fetchData()
  }, [codeId])

  const copyUrl = async () => {
    await navigator.clipboard.writeText(`https://smartqr.id/c/${code?.short_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Code not found</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{code.title || 'QR Code Details'}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Quick Stats</h2>
              <button
                onClick={copyUrl}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 mb-1">Total Scans</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.total_scans || 0}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-600 mb-1">Today</p>
                <p className="text-2xl font-bold text-green-900">{stats?.today_scans || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-purple-600 mb-1">This Week</p>
                <p className="text-2xl font-bold text-purple-900">{stats?.this_week || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-orange-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-orange-900">{stats?.this_month || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
            {recentScans.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scans yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentScans.map((scan) => (
                      <tr key={scan.id} className="text-sm">
                        <td className="py-3 text-gray-900">
                          {new Date(scan.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 text-gray-600">
                          {scan.city}, {scan.country}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            scan.device_category === 'mobile_ios' ? 'bg-blue-100 text-blue-700' :
                            scan.device_category === 'mobile_android' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {scan.device_category?.replace('mobile_', '').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">QR Code</h2>
            <div className="flex items-center justify-center bg-gray-100 rounded-xl p-4 mb-4">
              {qrImage ? (
                <img src={qrImage} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <svg className="animate-spin w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-500 mb-1">Short URL</p>
                <p className="font-mono text-blue-600">smartqr.id/c/{code.short_code}</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 mb-1">Destination</p>
                <p className="text-gray-900 truncate">{code.destination_url}</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {code.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 mb-1">Created</p>
                <p className="text-gray-900">{new Date(code.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <a
                href={qrImage}
                download={`qr-${code.short_code}.png`}
                className="w-full py-2 px-4 bg-blue-600 text-white text-center text-sm font-semibold rounded-xl hover:bg-blue-700 transition block"
              >
                Download PNG
              </a>
              <Link
                href={`/dashboard/codes/${codeId}/edit`}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 text-center text-sm font-semibold rounded-xl hover:bg-gray-200 transition block"
              >
                Edit Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
