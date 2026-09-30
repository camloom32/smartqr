'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function CreateQRPage() {
  const [url, setUrl] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [qrPng, setQrPng] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    if (!url) {
      setQrPng('')
      setQrSvg('')
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/qr/preview?url=${encodeURIComponent(url)}&fg=${encodeURIComponent(fgColor)}&bg=${encodeURIComponent(bgColor)}`)
        const data = await res.json()
        setQrPng(data.png || '')
        setQrSvg(data.svg || '')
      } catch {
        // ignore
      }
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [url, fgColor, bgColor])

  const handleDownload = (format: 'png' | 'svg') => {
    if (format === 'png' && qrPng) {
      const link = document.createElement('a')
      link.href = qrPng
      link.download = 'qrcode.png'
      link.click()
    } else if (format === 'svg' && qrSvg) {
      const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'qrcode.svg'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto" />
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Upgrade
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Your QR Code</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Enter any URL to generate a static QR code. Free to use, no account required.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-lg font-semibold mb-6">Customize</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foreground</label>
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 overflow-hidden relative cursor-pointer shrink-0"
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
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 overflow-hidden relative cursor-pointer shrink-0"
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
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className={`mt-4 p-4 rounded-xl ${scanScore.bgColor}`}>
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
                <button
                  onClick={() => { setFgColor('#000000'); setBgColor('#ffffff') }}
                  className="text-sm text-gray-500 hover:text-gray-700 mt-2"
                >
                  Reset colors
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-6 w-full">Preview</h2>
            
            <div 
              className="w-64 h-64 flex items-center justify-center rounded-2xl overflow-hidden mb-6"
              style={{ backgroundColor: bgColor }}
            >
              {loading ? (
                <div className="animate-pulse">
                  <div className="w-48 h-48 bg-gray-300 rounded" />
                </div>
              ) : qrPng ? (
                <img 
                  src={qrPng} 
                  alt="QR Code" 
                  className="w-48 h-48"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <p className="text-gray-400 text-sm">Enter a URL to preview</p>
              )}
            </div>

            {qrPng && (
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handleDownload('png')}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => handleDownload('svg')}
                  className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Download SVG
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Static QR codes are free forever. Create an account to unlock dynamic codes with real-time analytics.</p>
          <Link href="/signup" className="text-blue-600 hover:underline mt-1 inline-block">
            Sign up for free
          </Link>
        </div>
      </main>
    </div>
  )
}
