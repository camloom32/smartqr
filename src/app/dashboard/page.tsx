import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/database.types'

type Code = Database['public']['Tables']['dynamic_codes']['Row']

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: codes } = await supabase
    .from('dynamic_codes')
    .select('id, short_code, destination_url, title, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = subscription?.tier || 'free'
  const codeCount = codes?.length || 0

  const maxCodes = tier === 'free' ? 0 : tier === 'starter' ? 3 : 15
  const canCreateMore = tier !== 'free' && codeCount < maxCodes

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {codeCount} code{codeCount !== 1 ? 's' : ''}
            {tier !== 'free' && ` · ${tier} plan (${maxCodes} max)`}
            {tier === 'free' && ' · Free plan'}
          </p>
        </div>
        <Link
          href="/dashboard/codes/new"
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
            canCreateMore
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          + Create QR Code
        </Link>
      </div>

      {codeCount === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No QR codes yet</h2>
          <p className="text-gray-500 mb-6">
            {tier === 'free'
              ? 'Dynamic QR codes require a Starter or Growth plan.'
              : 'Create your first dynamic QR code and start tracking scans.'}
          </p>
          {tier === 'free' ? (
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              View plans
            </Link>
          ) : (
            <Link
              href="/dashboard/codes/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              Create your first QR code
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Short URL</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Destination</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(codes as Code[] | null)?.map((code: Code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/codes/${code.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {code.title || 'Untitled'}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-blue-600 font-mono">
                      smartqr.id/c/{code.short_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 truncate max-w-xs block">
                      {code.destination_url}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      code.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
