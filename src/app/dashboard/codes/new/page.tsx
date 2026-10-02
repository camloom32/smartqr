'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export default function NewCodePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [logo, setLogo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewSvg, setPreviewSvg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<'free' | 'starter' | 'growth'>('free')
  const [codeCount, setCodeCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('smartqr_tier') as 'free' | 'starter' | 'growth' | null
    if (stored) setPlan(stored)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const supabaseClient = supabase
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return

      const [codesResult, subResult] = await Promise.all([
        supabaseClient.from('dynamic_codes').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabaseClient.from('subscriptions').select('tier, status').eq('user_id', user.id).in('status', ['active', 'trialing']).single(),
      ])

      const sub = subResult.data as Subscription | null
      const count = codesResult.count || 0

      setPlan((sub?.tier as typeof plan) || 'free')
      setCodeCount(count)
    }
    fetchData()
  }, [])

  const getBase64FromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  useEffect(() => {
    if (!destinationUrl) {
      setPreviewUrl('')
      setPreviewSvg('')
      return
    }

    const timer = setTimeout(async () => {
      try {
        const body: Record<string, string> = { url: destinationUrl, fg: fgColor, bg: bgColor }
        if (logo) {
          body.logo = await getBase64FromFile(logo)
        }
        const res = await fetch('/api/qr/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        setPreviewUrl(data.png || '')
        setPreviewSvg(data.svg || '')
      } catch {
        // ignore
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [destinationUrl, fgColor, bgColor, logo])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogo(file)
  }

  const maxCodes = plan === 'starter' ? 5 : 25
  const canCreate = plan !== 'free' && codeCount < maxCodes

  const getContrastRatio = (hex1: string, hex2: string): number => {
    const parse = (hex: string) => {
      const clean = hex.replace('#', '')
      const r = parseInt(clean.substring(0, 2), 16) / 255
      const g = parseInt(clean.substring(2, 4), 16) / 255
      const b = parseInt(clean.substring(4, 6), 16) / 255
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
    }
    const l1 = parse(hex1)
    const l2 = parse(hex2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const getScanScore = (contrast: number): { score: number; label: string; color: string; bgColor: string } => {
    if (contrast >= 10) return { score: 100, label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (contrast >= 7) return { score: 90, label: 'Great', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (contrast >= 5) return { score: 75, label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    if (contrast >= 3) return { score: 50, label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    return { score: 25, label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  const contrast = getContrastRatio(fgColor, bgColor)
  const scanScore = getScanScore(contrast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canCreate) {
      setError(`Your ${plan} plan allows up to ${maxCodes} active codes.`)
      return
    }
    if (!destinationUrl) {
      setError('Please enter a destination URL.')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let logoBase64 = undefined
      if (logo) {
        logoBase64 = await getBase64FromFile(logo)
      }
      const res = await fetch('/api/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ title, destinationUrl, style: { foregroundColor: fgColor, backgroundColor: bgColor, logo: logoBase64 } }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create code')
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create QR Code</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My QR Code"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL *</label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://yoursite.com"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foreground color</label>
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 overflow-hidden relative cursor-pointer shrink-0"
                    style={{ backgroundColor: fgColor }}
                  >
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background color</label>
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 overflow-hidden relative cursor-pointer shrink-0"
                    style={{ backgroundColor: bgColor }}
                  >
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${scanScore.bgColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Scanability Score</p>
                  <p className={`text-2xl font-bold ${scanScore.color}`}>{scanScore.score}/100</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${scanScore.color} ${scanScore.bgColor}`}>
                    {scanScore.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{contrast.toFixed(1)}:1 contrast</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${scanScore.score >= 75 ? 'bg-green-500' : scanScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${scanScore.score}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo ({plan === 'free' ? 'Starter+ required' : 'optional'})
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={plan === 'free'}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 disabled:opacity-50"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !canCreate}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create QR Code'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Preview</h2>
          <div className="flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="QR Preview"
                className="max-w-full max-h-full object-contain"
                style={{ width: 200, height: 200 }}
              />
            ) : (
              <p className="text-gray-400 text-sm">Enter a URL to see preview</p>
            )}
          </div>
          {!canCreate && (
            <p className="text-xs text-center text-gray-500 mt-3">
              {plan === 'free'
                ? 'Upgrade to Starter to create dynamic QR codes'
                : `You have reached your ${maxCodes} code limit`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
