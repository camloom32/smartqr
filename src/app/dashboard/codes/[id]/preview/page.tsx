'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

export default function CodePreviewPage() {
  const params = useParams()
  const codeId = params.id as string

  const [qrImage, setQrImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPreview = async () => {
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
        setError('Code not found')
        setLoading(false)
        return
      }

      setCode(codeData)

      const style = codeData.style_json || {}
      const fg = encodeURIComponent(style.foregroundColor || '#000000')
      const bg = encodeURIComponent(style.backgroundColor || '#ffffff')
      const logoParam = style.logo ? `&logo=${encodeURIComponent(style.logo)}` : ''

      const res = await fetch(`/api/qr/preview?url=${encodeURIComponent(`https://smartqr.id/c/${codeData.short_code}`)}&fg=${fg}&bg=${bg}${logoParam}`)
      const data = await res.json()
      setQrImage(data.png || '')
      setLoading(false)
    }

    fetchPreview()
  }, [codeId])

  const handleDownload = () => {
    if (!qrImage) return
    const link = document.createElement('a')
    link.href = qrImage
    link.download = `qr-${code?.short_code || 'code'}.png`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !code) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || 'Code not found'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back to dashboard</Link>
        </div>
      </div>
    )
  }

  const style = code.style_json || {}

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto" />
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{code.title || 'QR Code Preview'}</h1>
        <p className="text-gray-500 mb-8">smartqr.id/c/{code.short_code}</p>

        <div className="bg-gray-50 rounded-2xl p-8 mb-8 inline-block">
          <div className="w-64 h-64 mx-auto" style={{ backgroundColor: style.backgroundColor || '#ffffff' }}>
            {qrImage ? (
              <img src={qrImage} alt="QR Code" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Loading...</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleDownload}
            disabled={!qrImage}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            Download PNG
          </button>
          <Link
            href={`/dashboard/codes/${codeId}`}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition block"
          >
            View Analytics
          </Link>
        </div>
      </main>
    </div>
  )
}
