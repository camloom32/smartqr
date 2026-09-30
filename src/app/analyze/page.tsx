'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

function getLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 1
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getScore(contrast: number): { score: number; label: string; color: string; bgColor: string; description: string } {
  if (contrast >= 10) return {
    score: 100,
    label: 'Excellent',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Perfect contrast for reliable scanning in all conditions'
  }
  if (contrast >= 7) return {
    score: 90,
    label: 'Great',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Very reliable, works well in most lighting conditions'
  }
  if (contrast >= 5) return {
    score: 75,
    label: 'Good',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Decent scanning, may struggle in bright or low light'
  }
  if (contrast >= 3) return {
    score: 50,
    label: 'Fair',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'May cause scanning issues, especially with older readers'
  }
  return {
    score: 25,
    label: 'Poor',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'High risk of scanning failures, consider redesigning'
  }
}

export default function AnalyzePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<{
    foreground: string
    background: string
    contrast: number
    score: number
    label: string
    color: string
    bgColor: string
    borderColor: string
    description: string
  } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeImage = async (file: File) => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) return
          
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          const colorCounts: Map<string, number> = new Map()
          const step = 4

          for (let i = 0; i < data.length; i += step * 10) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const hex = rgbToHex(r, g, b)
            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1)
          }

          const sortedColors = [...colorCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([color]) => color)

          let lightColor = '#ffffff'
          let darkColor = '#000000'
          let maxLightness = -1
          let minLightness = 2

          for (const hex of sortedColors.slice(0, 50)) {
            const rgb = hexToRgb(hex)
            if (!rgb) continue
            const lum = getLuminance(rgb.r, rgb.g, rgb.b)
            if (lum > maxLightness) {
              maxLightness = lum
              lightColor = hex
            }
            if (lum < minLightness) {
              minLightness = lum
              darkColor = hex
            }
          }

          const contrast = getContrastRatio(lightColor, darkColor)
          const scoreInfo = getScore(contrast)

          setResults({
            foreground: darkColor,
            background: lightColor,
            contrast,
            ...scoreInfo,
          })
          setImageUrl(e.target?.result as string)
        }
        img.onerror = () => {
          setError('Failed to load image')
        }
        img.src = e.target?.result as string
      }
      reader.onerror = () => {
        setError('Failed to read file')
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Failed to analyze image')
    }
    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    analyzeImage(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      analyzeImage(file)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto" />
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Upgrade
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">QR Code Analyzer</h1>
          <p className="text-lg text-gray-600">
            Upload a QR code to analyze its scanability and get improvement suggestions
          </p>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-8 hover:border-blue-400 transition cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Drop your QR code here or click to upload</p>
              <p className="text-sm text-gray-500 mt-1">Supports PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-gray-500 mt-4">Analyzing your QR code...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center mb-8">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {imageUrl && (
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <img src={imageUrl} alt="Uploaded QR" className="w-40 h-40 object-contain rounded-xl" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Scanability Score</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${results.color} ${results.bgColor}`}>
                      {results.label}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-end gap-2">
                      <span className={`text-5xl font-bold ${results.color}`}>{results.score}</span>
                      <span className="text-gray-400 text-2xl mb-1">/100</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          results.score >= 75 ? 'bg-green-500' : results.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.score}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm">{results.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Color Analysis</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Foreground (modules)</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: results.foreground }}
                    />
                    <span className="font-mono text-gray-700">{results.foreground.toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Background</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: results.background }}
                    />
                    <span className="font-mono text-gray-700">{results.background.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Contrast Ratio</span>
                  <span className="font-semibold text-gray-900">{results.contrast.toFixed(2)}:1</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  WCAG requires 4.5:1 for normal text, 3:1 for large text
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">How to improve your QR code:</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Use high contrast colors (black on white scores 21:1)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Ensure adequate quiet zone (margin) around the QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Avoid decorative colors that reduce contrast below 3:1</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Test with multiple scanning apps before printing</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-3">Create a high-scoring QR code with SmartQR</p>
              <Link href="/create" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
                Create QR Code Free
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
