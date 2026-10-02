import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TOKEN_SECRET = process.env.STRIPE_SECRET_KEY || 'team-invite-secret'

function createToken(teamMemberId: string, ownerId: string, memberEmail: string): string {
  const payload = {
    teamMemberId,
    ownerId,
    memberEmail,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  const payload64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload64).digest('base64url')
  return `${payload64}.${sig}`
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, name, ownerId } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', ownerId || userId)
    .eq('member_email', email.toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This person has already been invited' }, { status: 400 })
  }

  const { data: member, error } = await supabase
    .from('team_members')
    .insert({
      owner_id: ownerId || userId,
      member_email: email.toLowerCase(),
      member_name: name || null,
      role: 'member',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const token = createToken(member.id, member.owner_id, member.member_email)
  const inviteUrl = `/dashboard/team/claim?token=${token}`

  return NextResponse.json({ token, inviteUrl })
}
