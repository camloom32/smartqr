import Link from 'next/link'

const FREE_TOOLS = [
  {
    href: '/create',
    label: 'QR Code Creator',
    desc: 'Create static QR codes for any URL',
  },
  {
    href: '/scan',
    label: 'QR Scanner',
    desc: 'Scan from camera or upload an image',
  },
  {
    href: '/analyze',
    label: 'QR Analyzer',
    desc: 'Check contrast and scanability',
  },
  {
    href: '/wifi',
    label: 'WiFi QR Generator',
    desc: 'Create printable WiFi cards',
  },
]

export default function ToolLinks({ showUpgrade = true }: { showUpgrade?: boolean }) {
  return (
    <section className="py-16 px-6 bg-gray-50 mt-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">All QR Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FREE_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition group"
            >
              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{tool.label}</p>
              <p className="text-sm text-gray-500 mt-1">{tool.desc}</p>
            </Link>
          ))}
          {showUpgrade && (
            <Link
              href="/pricing"
              className="bg-blue-50 rounded-xl p-5 border border-blue-200 hover:border-blue-400 hover:shadow-md transition group"
            >
              <p className="font-semibold text-blue-700 group-hover:text-blue-800 transition">Dynamic QR Codes</p>
              <p className="text-sm text-blue-600 mt-1">Analytics, editable URLs, logo support</p>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
