import Link from 'next/link'

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">⏰</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">QR Code Expired</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        This QR code is no longer active. The owner may have cancelled their subscription or the code has been deactivated.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        Create your own QR code
      </Link>
    </div>
  )
}
