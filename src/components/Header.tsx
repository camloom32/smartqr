'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="SmartQR" width={140} height={40} className="h-10 w-auto" />
        </Link>
        <nav className="flex items-center gap-6">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              Free Tools
              <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                <Link
                  href="/scan"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">QR Scanner</p>
                    <p className="text-xs text-gray-500">Scan QR codes from any image or camera</p>
                  </div>
                </Link>
                <Link
                  href="/analyze"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">QR Analyzer</p>
                    <p className="text-xs text-gray-500">Check contrast, colors, and scanability</p>
                  </div>
                </Link>
                <Link
                  href="/wifi"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">WiFi QR Generator</p>
                    <p className="text-xs text-gray-500">Create printable WiFi cards for guests</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
          <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  )
}
