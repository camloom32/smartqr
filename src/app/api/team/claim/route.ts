import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TOKEN_SECRET = process.env.STRIPE_SECRET_KEY || 'team-invite-secret'

function verifyToken(token: string) {
  try {
    const [payload64, sig] = token.split('.')
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload64).digest('base64url')
    if (sig !== expectedSig) return null
    const payload = JSON.parse(Buffer.from(payload64, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: owner } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', payload.ownerId)
    .single()

  return NextResponse.json({
    teamMemberId: payload.teamMemberId,
    ownerId: payload.ownerId,
    memberEmail: payload.memberEmail,
    ownerEmail: owner?.email || null,
  })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamMemberId } = await req.json()
  if (!teamMemberId) return NextResponse.json({ error: 'Missing teamMemberId' }, { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('team_members')
    .update({
      accepted_at: new Date().toISOString(),
    })
    .eq('id', teamMemberId)
    .eq('member_email', profile?.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
