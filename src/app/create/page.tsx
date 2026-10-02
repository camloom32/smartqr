'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import ToolLinks from '@/components/ToolLinks'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Frame = {
  id: string
  name: string
  description: string
  tier: 'free' | 'starter'
}

type QRStyleOption = {
  id: string
  name: string
  description: string
  tier: 'free' | 'starter'
}

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

export default function CreateQRPage() {
  const [url, setUrl] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [qrPng, setQrPng] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const [loading, setLoading] = useState(false)
  const [tier, setTier] = useState<'free' | 'starter' | 'growth'>('free')
  const [frame, setFrame] = useState('none')
  const [caption, setCaption] = useState('')
  const [subcaption, setSubcaption] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState('')
  const [qrStyle, setQrStyle] = useState('square')

  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function checkTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .maybeSingle()

        const detectedTier = sub?.tier || 'free'
        console.log('[create] tier check:', detectedTier, sub)
        setTier(detectedTier as 'free' | 'starter' | 'growth')
        localStorage.setItem('smartqr_tier', detectedTier)
      } catch (e) {
        console.error('[create] tier error:', e)
      }
    }
    checkTier()
  }, [])

  useEffect(() => {
    if (!url) { setQrPng(''); setQrSvg(''); return }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const body: Record<string, string> = { url, fg: fgColor, bg: bgColor, style: qrStyle }
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
        setQrPng(data.png || '')
        setQrSvg(data.svg || '')
      } catch { /* ignore */ }
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [url, fgColor, bgColor, frame, caption, subcaption, logoPreview, qrStyle])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (tier === 'free') {
      setUpgradeTarget('logo')
      setShowUpgradeModal(true)
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleFrameSelect(frameId: string) {
    if (frameId !== 'none' && tier === 'free') {
      setUpgradeTarget(frameId)
      setShowUpgradeModal(true)
      return
    }
    setFrame(frameId)
  }

  function handleStyleSelect(styleId: string) {
    if (styleId !== 'square' && tier === 'free') {
      setUpgradeTarget(styleId)
      setShowUpgradeModal(true)
      return
    }
    setQrStyle(styleId)
  }

  const contrast = getContrastRatio(fgColor, bgColor)
  const scanScore = getScanScore(contrast)

  const needsCaption = frame === 'caption-bottom' || frame === 'caption-top-bottom'

  const handleDownload = (format: 'png' | 'svg') => {
    if (format === 'png' && qrPng) {
      const link = document.createElement('a')
      link.href = qrPng
      link.download = 'qrcode.png'
      link.click()
    } else if (format === 'svg' && qrSvg) {
      const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'qrcode.svg'
      link.click()
      URL.revokeObjectURL(blobUrl)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Your QR Code</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            {tier === 'free'
              ? 'Enter any URL to generate a static QR code. Sign up to unlock frames and logo.'
              : 'Customize your QR code with frames, colors, and your logo.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-lg font-semibold mb-6">Destination</h2>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-lg font-semibold mb-6">Colors</h2>
              <div className="grid grid-cols-2 gap-6">
                {[['Foreground', fgColor, setFgColor], ['Background', bgColor, setBgColor]].map(([label, color, setter]) => (
                  <div key={label as string}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label as string}</label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 overflow-hidden relative cursor-pointer shrink-0"
                        style={{ backgroundColor: color as string }}
                      >
                        <input
                          type="color"
                          value={color as string}
                          onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={color as string}
                        onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                        className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-4 p-4 rounded-xl ${scanScore.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Scanability</p>
                    <p className={`text-2xl font-bold ${scanScore.color}`}>{scanScore.score}/100</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${scanScore.color} ${scanScore.bgColor}`}>
                      {scanScore.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{contrast.toFixed(1)}:1 contrast</p>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${scanScore.score >= 75 ? 'bg-green-500' : scanScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${scanScore.score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Module Style</h2>
                {tier === 'free' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Starter+
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {QR_STYLES.map((s) => {
                  const locked = s.tier === 'starter' && tier === 'free'
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleStyleSelect(s.id)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        qrStyle === s.id
                          ? 'border-blue-500 bg-blue-50'
                          : locked
                          ? 'border-gray-100 bg-gray-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                      {locked && <p className="text-xs text-blue-600 mt-1 font-medium">🔒</p>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Frame Style</h2>
                {tier === 'free' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Starter+
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {FRAMES.map((f) => {
                  const locked = f.tier === 'starter' && tier === 'free'
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFrameSelect(f.id)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        frame === f.id
                          ? 'border-blue-500 bg-blue-50'
                          : locked
                          ? 'border-gray-100 bg-gray-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                      {locked && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">🔒 Upgrade</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {needsCaption && (
              <div className="bg-gray-50 rounded-2xl p-8">
                <h2 className="text-lg font-semibold mb-6">Frame Text</h2>
                <div className="space-y-4">
                  {frame === 'caption-top-bottom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Top Text</label>
                      <input
                        type="text"
                        value={subcaption}
                        onChange={(e) => setSubcaption(e.target.value)}
                        maxLength={40}
                        placeholder="Your Business Name"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {frame === 'caption-top-bottom' ? 'Bottom Text' : 'Caption'}
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={50}
                      placeholder="Scan to visit our website"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Logo Overlay</h2>
                {tier === 'free' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Starter+
                  </span>
                )}
              </div>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  tier === 'free' ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => tier === 'free' ? (setUpgradeTarget('logo'), setShowUpgradeModal(true)) : logoInputRef.current?.click()}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 mx-auto object-contain" />
                ) : (
                  <>
                    <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {tier === 'free' ? 'Upgrade to add your logo' : 'Click to upload logo'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                  </>
                )}
              </div>
              {logoPreview && tier !== 'free' && (
                <button
                  onClick={() => { setLogoFile(null); setLogoPreview('') }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove logo
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-6 w-full">Preview</h2>

            <div
              className="w-72 h-72 flex items-center justify-center rounded-2xl overflow-hidden mb-6"
              style={{ backgroundColor: bgColor }}
            >
              {loading ? (
                <div className="animate-pulse">
                  <div className="w-48 h-48 bg-gray-300 rounded" />
                </div>
              ) : qrPng ? (
                <img src={qrPng} alt="QR Code" className="w-48 h-48" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <p className="text-gray-400 text-sm text-center px-4">Enter a URL to preview</p>
              )}
            </div>

            {url && (
              <div className="w-full space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload('png')}
                    disabled={!qrPng}
                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => handleDownload('svg')}
                    disabled={!qrSvg}
                    className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Download SVG
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 w-full text-center">
              {tier === 'free' && (
                <p className="text-sm text-gray-500">
                  <Link href="/pricing" className="text-blue-600 hover:underline">Upgrade</Link> to unlock frames, logo, and dynamic QR codes
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock {upgradeTarget === 'logo' ? 'Logo Overlay' : 'Frame Styles'}</h3>
            <p className="text-gray-500 mb-6">
              {upgradeTarget === 'logo' ? 'Add your logo to the center of your QR code' : 'Premium frame styles for professional QR codes'} are available on Starter and Growth plans.
            </p>
            <Link
              href="/pricing"
              className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              View Plans
            </Link>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <ToolLinks />
    </div>
  )
}
