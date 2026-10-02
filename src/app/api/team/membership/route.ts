import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile?.email) {
    console.log('[DEBUG membership API] No profile found for userId:', userId)
    return NextResponse.json({ isTeamMember: false })
  }

  const { data: membership } = await supabaseAdmin
    .from('team_members')
    .select('owner_id, accepted_at')
    .eq('member_email', profile.email)
    .not('accepted_at', 'is', null)
    .single()

  if (!membership) {
    console.log('[DEBUG membership API] No membership found for email:', profile?.email)
    return NextResponse.json({ isTeamMember: false })
  }

  const { data: ownerProfile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', membership.owner_id)
    .single()

  const { data: ownerSub } = await supabaseAdmin
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', membership.owner_id)
    .in('status', ['active', 'trialing'])
    .single()

  console.log('[DEBUG membership API] userId:', userId, 'profile:', profile, 'membership:', membership, 'ownerSub:', ownerSub)
  return NextResponse.json({
    isTeamMember: true,
    ownerId: membership.owner_id,
    ownerEmail: ownerProfile?.email,
    teamTier: ownerSub?.tier || 'free',
    teamStatus: ownerSub?.status,
  })
}
