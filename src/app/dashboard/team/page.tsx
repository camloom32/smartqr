'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TeamMember = {
  id: string
  member_email: string
  member_name: string | null
  role: string
  invited_at: string
  accepted_at: string | null
}

export default function TeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email || '')
      await fetchMembers(session.user.id)
      setLoading(false)
    }
    checkAuth()
  }, [])

  async function fetchMembers(userId: string) {
    const res = await fetch(`/api/team/members`, {
      headers: { 'x-user-id': userId },
    })
    const data = await res.json()
    if (data.members) {
      setMembers(data.members)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const res = await fetch(`/api/team/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite')
        setInviteLoading(false)
        return
      }

      setInviteEmail('')
      setInviteName('')
      await fetchMembers(session.user.id)
    } catch {
      setInviteError('Something went wrong')
    }

    setInviteLoading(false)
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this team member?')) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`/api/team/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': session.user.id },
    })

    if (res.ok) {
      setMembers(members.filter(m => m.id !== memberId))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500 mt-1">Growth plan supports up to 3 team seats total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite a team member</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter the email address of the person you want to invite. They will be able to view and manage your QR codes.
        </p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Name (optional)"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-[2] rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={inviteLoading}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {inviteLoading ? 'Sending...' : 'Send invite'}
          </button>
        </form>
        {inviteError && <p className="text-sm text-red-600 mt-2">{inviteError}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Member</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{userEmail}</p>
                  <p className="text-sm text-gray-500">Account owner</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Owner</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-green-600">Active</span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm text-gray-400">—</span>
              </td>
            </tr>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{member.member_name || member.member_email}</p>
                    <p className="text-sm text-gray-500">{member.member_email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Member</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">Pending invite</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No team members yet. Send an invite above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
