'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Html5Qrcode } from 'html5-qrcode'

export default function ScanPage() {
  const [scannedResult, setScannedResult] = useState('')
  const [error, setError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const startCamera = async () => {
    setError('')
    setCameraError('')
    try {
      scannerRef.current = new Html5Qrcode('qr-reader')
      setIsScanning(true)
      setCameraActive(true)
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setScannedResult(decodedText)
          stopCamera()
        },
        () => {}
      )
    } catch (err: any) {
      setIsScanning(false)
      setCameraActive(false)
      if (err?.message?.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access.')
      } else {
        setCameraError('Could not start camera. Try uploading an image instead.')
      }
    }
  }

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {}
    }
    setIsScanning(false)
    setCameraActive(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setCameraError('')
    try {
      const scanner = new Html5Qrcode('qr-reader')
      const result = await scanner.scanFile(file, false)
      setScannedResult(result)
    } catch {
      setError('Could not find a QR code in this image')
    }
  }

  const copyResult = async () => {
    await navigator.clipboard.writeText(scannedResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUrl = (text: string) => {
    try {
      new URL(text)
      return true
    } catch {
      return text.startsWith('http')
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

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

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Scan QR Codes</h1>
          <p className="text-lg text-gray-600">
            Scan any QR code instantly using your camera or upload an image
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div id="qr-reader" className="w-full" />

          {!cameraActive ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use Camera
                </button>

                <label className="py-4 px-6 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-400 hover:text-blue-600 transition cursor-pointer flex flex-col items-center gap-2">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={stopCamera}
                className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition"
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-center">
            {cameraError}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            {error}
          </div>
        )}

        {scannedResult && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Result</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-gray-900 break-all">{scannedResult}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyResult}
                className="flex-1 min-w-[120px] py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              {isUrl(scannedResult) && (
                <a
                  href={scannedResult}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Link
                </a>
              )}

              <button
                onClick={() => setScannedResult('')}
                className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-gray-500 mb-3">Want to create your own QR codes?</p>
          <Link href="/create" className="text-blue-600 hover:underline font-medium">
            Create a free QR code
          </Link>
        </div>
      </main>
    </div>
  )
}
