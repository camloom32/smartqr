import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Image src="/logo.png" alt="SmartQR" width={512} height={146} className="mx-auto mb-8 h-36 w-auto" priority />
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
            QR codes that drive results
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Create stunning, customizable QR codes with real-time analytics.
            When you stop paying, your codes stop working — simple and transparent.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              Create QR Code
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 border border-gray-300 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Everything you need
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                title: 'Unlimited scans',
                desc: 'Never cap your scan count. If your QR code goes viral, we celebrate with you — not penalize you.',
              },
              {
                title: 'Edit anytime',
                desc: 'Dynamic codes let you change the destination URL without reprinting. Update in seconds.',
              },
              {
                title: 'Beautiful customization',
                desc: 'Custom colors, frames, and logos. Your QR code should look as good as your brand.',
              },
              {
                title: 'Real-time analytics',
                desc: 'See exactly when and where people scan your codes. Daily, weekly, monthly breakdowns.',
              },
              {
                title: 'High-res exports',
                desc: 'Download SVG, PNG, PDF for print. Your codes will look sharp on business cards or billboards.',
              },
              {
                title: 'No predatory pricing',
                desc: "You pay for the tool, not for your own success. Your scan data belongs to you.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-8">
            Free forever for static codes. No credit card required.
          </p>
          <Link
            href="/create"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Create a QR code
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>SmartQR — QR codes built for business</span>
          <Link href="/pricing" className="hover:text-gray-700">Pricing</Link>
        </div>
      </footer>
    </div>
  )
}
