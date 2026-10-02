import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { generateShortCode } from '@/lib/qrcode'

function generateCodeId(): string {
  return generateShortCode(6)
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : accessToken

  if (!bearerToken) {
    return NextResponse.json({ error: 'Unauthorized', debug: 'no token' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized', debug: userError?.message }, { status: 401 })
  }

  const body = await req.json()
  const { title, destinationUrl, style } = body

  if (!destinationUrl) {
    return NextResponse.json({ error: 'Destination URL required' }, { status: 400 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()

  const tier = subscription?.tier || 'free'

  const { count } = await supabase
    .from('dynamic_codes')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_active', true)

  const maxCodes = tier === 'free' ? 1 : tier === 'starter' ? 5 : 25
  if ((count || 0) >= maxCodes) {
    return NextResponse.json(
      { error: tier === 'free'
        ? 'Free plan includes 1 QR code. Upgrade to Starter for 3 codes.'
        : `Your ${tier} plan allows up to ${maxCodes} active codes` },
      { status: 403 }
    )
  }

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
