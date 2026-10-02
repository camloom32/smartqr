'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

type Frame = { id: string; name: string; description: string; tier: 'free' | 'starter' }
type QRStyleOption = { id: string; name: string; description: string; tier: 'free' | 'starter' }

const FRAMES: Frame[] = [
  { id: 'none', name: 'Plain', description: 'No frame', tier: 'free' },
  { id: 'border', name: 'Border', description: 'Clean border around QR', tier: 'starter' },
  { id: 'rounded', name: 'Rounded', description: 'Rounded corners, modern look', tier: 'starter' },
  { id: 'caption-bottom', name: 'Caption Below', description: 'Text banner under QR', tier: 'starter' },
  { id: 'caption-top-bottom', name: 'Top & Bottom', description: 'Text above and below QR', tier: 'starter' },
  { id: 'badge-corner', name: 'Scan Badge', description: 'Corner badge overlay', tier: 'starter' },
]

const QR_STYLES: QRStyleOption[] = [
  { id: 'square', name: 'Square', description: 'Classic square modules', tier: 'free' },
  { id: 'dot', name: 'Dots', description: 'Circular dot modules', tier: 'starter' },
  { id: 'rounded', name: 'Rounded', description: 'Soft rounded modules', tier: 'starter' },
  { id: 'classy', name: 'Classy', description: 'Elegant rounded squares', tier: 'starter' },
  { id: 'classy-rounded', name: 'Extra Rounded', description: 'Fully rounded modules', tier: 'starter' },
]

function getContrastRatio(hex1: string, hex2: string): number {
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
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function getScanScore(contrast: number) {
  if (contrast >= 10) return { score: 100, label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' }
  if (contrast >= 7) return { score: 90, label: 'Great', color: 'text-green-600', bgColor: 'bg-green-50' }
  if (contrast >= 5) return { score: 75, label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
  if (contrast >= 3) return { score: 50, label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-50' }
  return { score: 25, label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50' }
}

export default function NewCodePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewSvg, setPreviewSvg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<'free' | 'starter' | 'growth'>('free')
  const [codeCount, setCodeCount] = useState(0)
  const [qrStyle, setQrStyle] = useState('square')
  const [frame, setFrame] = useState('none')
  const [caption, setCaption] = useState('')
  const [subcaption, setSubcaption] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState('')
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null)
  const [isTeamMember, setIsTeamMember] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('smartqr_tier') as 'free' | 'starter' | 'growth' | null
    if (stored) setPlan(stored)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const supabaseClient = supabase
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return

      const [membershipRes, codesResult, subResult] = await Promise.all([
        fetch('/api/team/membership', { headers: { 'x-user-id': user.id } }),
        supabaseClient.from('dynamic_codes').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabaseClient.from('subscriptions').select('tier, status').eq('user_id', user.id).in('status', ['active', 'trialing']).single(),
      ])

      const membershipData = await membershipRes.json()
      const isTeamMember = membershipData.isTeamMember
      const ownerId = membershipData.ownerId
      const teamTier = membershipData.teamTier

      const sub = subResult.data as Subscription | null
      let count = codesResult.count || 0
      let effectiveTier = (sub?.tier as typeof plan) || 'free'

      if (isTeamMember && ownerId) {
        const { count: teamCount } = await supabaseClient
          .from('dynamic_codes')
          .select('id', { count: 'exact' })
          .eq('user_id', ownerId)
          .eq('is_active', true)
        count = teamCount || 0
        effectiveTier = teamTier || effectiveTier
        setTeamOwnerId(ownerId)
        setIsTeamMember(true)
      }

      setPlan(effectiveTier)
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
        const body: Record<string, string> = { url: destinationUrl, fg: fgColor, bg: bgColor, style: qrStyle }
        if (frame !== 'none') body.frame = frame
        if (caption) body.caption = caption
        if (subcaption) body.subcaption = subcaption
        if (logoPreview) body.logo = logoPreview
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
  }, [destinationUrl, fgColor, bgColor, qrStyle, frame, caption, subcaption, logoPreview])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (plan === 'free') {
      setUpgradeTarget('logo')
      setShowUpgradeModal(true)
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleStyleSelect = (styleId: string) => {
    if (styleId !== 'square' && plan === 'free') {
      setUpgradeTarget(styleId)
      setShowUpgradeModal(true)
      return
    }
    setQrStyle(styleId)
  }

  const handleFrameSelect = (frameId: string) => {
    if (frameId !== 'none' && plan === 'free') {
      setUpgradeTarget(frameId)
      setShowUpgradeModal(true)
      return
    }
    setFrame(frameId)
  }

  const setLogoFile = (file: File) => setLogo(file)

  const maxCodes = plan === 'starter' ? 5 : 25
  const canCreate = plan !== 'free' && codeCount < maxCodes
  const needsCaption = frame === 'caption-bottom' || frame === 'caption-top-bottom'
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
        body: JSON.stringify({ title, destinationUrl, ownerId: teamOwnerId, style: { foregroundColor: fgColor, backgroundColor: bgColor, style: qrStyle, frame, caption, subcaption, logo: logoBase64 } }),
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

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Module Style</h3>
                {plan === 'free' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Starter+</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {QR_STYLES.map((s) => {
                  const locked = s.tier === 'starter' && plan === 'free'
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStyleSelect(s.id)}
                      className={`p-2 rounded-lg border-2 text-left transition text-xs ${
                        qrStyle === s.id
                          ? 'border-blue-500 bg-blue-50'
                          : locked
                          ? 'border-gray-100 bg-gray-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-gray-500 mt-0.5 leading-tight">{s.description}</p>
                      {locked && <p className="text-blue-600 mt-1 font-medium">🔒</p>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Frame Style</h3>
                {plan === 'free' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Starter+</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FRAMES.map((f) => {
                  const locked = f.tier === 'starter' && plan === 'free'
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFrameSelect(f.id)}
                      className={`p-2 rounded-lg border-2 text-left transition text-xs ${
                        frame === f.id
                          ? 'border-blue-500 bg-blue-50'
                          : locked
                          ? 'border-gray-100 bg-gray-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{f.name}</p>
                      <p className="text-gray-500 mt-0.5 leading-tight">{f.description}</p>
                      {locked && <p className="text-blue-600 mt-1 font-medium">🔒</p>}
                    </button>
                  )
                })}
              </div>
            </div>

            {needsCaption && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Frame Text</p>
                {frame === 'caption-top-bottom' && (
                  <input
                    type="text"
                    value={subcaption}
                    onChange={(e) => setSubcaption(e.target.value)}
                    maxLength={40}
                    placeholder="Your Business Name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 text-sm"
                  />
                )}
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={50}
                  placeholder={frame === 'caption-top-bottom' ? 'Bottom text' : 'Caption text'}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 text-sm"
                />
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Logo Overlay</h3>
                {plan === 'free' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Starter+</span>
                )}
              </div>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  plan === 'free' ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => plan === 'free' ? (setUpgradeTarget('logo'), setShowUpgradeModal(true)) : logoInputRef.current?.click()}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={logoPreview} alt="Logo preview" className="w-10 h-10 object-contain" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLogo(null); setLogoPreview('') }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {plan === 'free' ? 'Upgrade to add your logo' : 'Click to upload logo'}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
              </div>
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
          <div className="flex items-center justify-center rounded-xl overflow-hidden" style={{ minHeight: 280, backgroundColor: bgColor }}>
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

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock {upgradeTarget === 'logo' ? 'Logo Overlay' : upgradeTarget === 'dot' || upgradeTarget === 'rounded' || upgradeTarget === 'classy' || upgradeTarget === 'classy-rounded' ? 'Module Styles' : 'Frame Styles'}</h3>
            <p className="text-gray-500 mb-6">
              {upgradeTarget === 'logo' ? 'Add your logo to the center of your QR code' : 'Premium style options for professional QR codes'} are available on Starter and Growth plans.
            </p>
            <a
              href="/pricing"
              className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              View Plans
            </a>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
