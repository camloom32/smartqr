import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateShortCode } from '@/lib/qrcode'

function generateCodeId(): string {
  return generateShortCode(6)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, destinationUrl, style } = body

  if (!destinationUrl) {
    return NextResponse.json({ error: 'Destination URL required' }, { status: 400 })
  }

  // Check subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = subscription?.tier || 'free'

  // Check code limit based on tier
  const { count } = await supabase
    .from('dynamic_codes')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_active', true)

  const maxCodes = tier === 'free' ? 1 : tier === 'starter' ? 3 : 15
  if ((count || 0) >= maxCodes) {
    return NextResponse.json(
      { error: tier === 'free' 
        ? 'Free plan includes 1 QR code. Upgrade to Starter for 3 codes.' 
        : `Your ${tier} plan allows up to ${maxCodes} active codes` },
      { status: 403 }
    )
  }

  // Generate unique short code
  let shortCode = generateCodeId()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('dynamic_codes')
      .select('id')
      .eq('short_code', shortCode)
      .single()

    if (!existing) break
    shortCode = generateCodeId()
    attempts++
  }

  const { data, error } = await supabase
    .from('dynamic_codes')
    .insert({
      user_id: user.id,
      short_code: shortCode,
      destination_url: destinationUrl,
      title: title || null,
      style_json: style || {},
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
