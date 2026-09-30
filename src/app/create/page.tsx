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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foreground</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => { setFgColor('#000000'); setBgColor('#ffffff') }}
                  className="text-sm text-gray-500 hover:text-gray-700"
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
