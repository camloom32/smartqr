'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { jsPDF } from 'jspdf'

type Template = 'modern' | 'minimal' | 'bold' | 'classic'

export default function WifiPage() {
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [template, setTemplate] = useState<Template>('modern')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [hidden, setHidden] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!ssid) {
      setQrDataUrl('')
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/wifi-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ssid, password, encryption, hidden }),
        })
        const data = await res.json()
        if (data.png) {
          setQrDataUrl(data.png)
        }
      } catch {
        // ignore
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [ssid, password, encryption, hidden])

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Network: ${ssid}\nPassword: ${password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPdf = async () => {
    if (!ssid || !qrDataUrl) return

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20

    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    if (template === 'modern') {
      pdf.setFillColor(245, 247, 250)
      pdf.rect(margin, margin, pageWidth - margin * 2, 110, 'F')
      pdf.addImage(qrDataUrl, 'PNG', margin + 15, margin + 15, 80, 80)
      pdf.setFontSize(32)
      pdf.setFont('helvetica', 'bold')
      pdf.text('WiFi', margin + 110, margin + 40)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Network', margin + 110, margin + 58)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(ssid, margin + 110, margin + 72)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Password', margin + 110, margin + 88)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(password || '(none)', margin + 110, margin + 102)
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, margin + 120, pageWidth - margin, margin + 120)
      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      pdf.text('Scan QR code or enter credentials to connect', margin, margin + 130)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)
      pdf.text(`Network: ${ssid}  |  Password: ${password || '(none)'}`, margin, pageHeight - 15)
    } else if (template === 'minimal') {
      pdf.addImage(qrDataUrl, 'PNG', (pageWidth - 70) / 2, margin + 15, 70, 70)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text(ssid, pageWidth / 2, margin + 105, { align: 'center' })
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'normal')
      pdf.text(password || '(none)', pageWidth / 2, margin + 118, { align: 'center' })
      pdf.setDrawColor(0, 0, 0)
      pdf.line(margin + 50, margin + 130, pageWidth - margin - 50, margin + 130)
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text('WiFi Network', pageWidth / 2, margin + 142, { align: 'center' })
    } else if (template === 'bold') {
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, pageWidth, 45, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('GUEST WiFi', pageWidth / 2, 30, { align: 'center' })
      pdf.setTextColor(0, 0, 0)
      pdf.addImage(qrDataUrl, 'PNG', margin + 25, 60, 65, 65)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Network:', margin + 105, 80)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      pdf.text(ssid, margin + 105, 92)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Password:', margin + 105, 110)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      pdf.text(password || '(none)', margin + 105, 122)
    } else {
      pdf.setDrawColor(0, 0, 0)
      pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
      pdf.addImage(qrDataUrl, 'PNG', (pageWidth - 75) / 2, margin + 20, 75, 75)
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.text('WiFi Network', pageWidth / 2, margin + 115, { align: 'center' })
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`SSID: ${ssid}`, pageWidth / 2, margin + 132, { align: 'center' })
      pdf.text(`Password: ${password || '(none)'}`, pageWidth / 2, margin + 145, { align: 'center' })
    }

    pdf.save(`wifi-${ssid.replace(/\s+/g, '-').toLowerCase()}.pdf`)
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">WiFi QR Code Generator</h1>
          <p className="text-lg text-gray-600">
            Create beautiful, printable WiFi cards for your guests. Perfect for Airbnb, hotels, cafes, and offices.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">WiFi Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="MyGuestWiFi"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="yourpassword123"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security</label>
                  <select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hidden}
                    onChange={(e) => setHidden(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hidden network</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Template Style</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['modern', 'minimal', 'bold', 'classic'] as Template[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      template === t
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 capitalize">{t}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t === 'modern' && 'Clean with sidebar layout'}
                      {t === 'minimal' && 'Centered, minimal design'}
                      {t === 'bold' && 'Blue header, bold style'}
                      {t === 'classic' && 'Bordered, traditional'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[320px] flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <div className="text-center">
                    <img src={qrDataUrl} alt="WiFi QR Code" className="w-48 h-48 mx-auto" />
                    <p className="font-semibold text-gray-900 mt-3">{ssid}</p>
                    <p className="text-sm text-gray-500">{password || '(no password)'}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{encryption}{hidden ? ' (hidden)' : ''}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">Enter network details to preview</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {(['modern', 'minimal', 'bold', 'classic'] as Template[]).map((t) => (
                  <span
                    key={t}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      template === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyCredentials}
                disabled={!ssid || !password}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
              <button
                onClick={downloadPdf}
                disabled={!ssid || !qrDataUrl}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                Download PDF
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-medium text-amber-800 mb-2">Printing Tips</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Download as PDF for best print quality</li>
                <li>• Print at 100% scale (no shrinking)</li>
                <li>• Use cardstock paper for durable cards</li>
                <li>• Place QR code at least 2cm from edges</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-3">Create your own custom QR codes with SmartQR</p>
          <Link href="/create" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
            Create QR Code Free
          </Link>
        </div>
      </main>
    </div>
  )
}
