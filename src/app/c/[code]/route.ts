import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

function parseDeviceCategory(ua: string): 'mobile_ios' | 'mobile_android' | 'desktop' | 'tablet' | 'other' {
  const lower = ua.toLowerCase()
  if (/iphone|ipad|ipod|ios/i.test(lower)) return 'mobile_ios'
  if (/android/i.test(lower)) return 'mobile_android'
  if (/tablet|ipad/i.test(lower)) return 'tablet'
  if (/mobile/i.test(lower)) return 'mobile_android'
  return 'desktop'
}

async function geoLookup(ip: string): Promise<{ country: string; region: string; city: string }> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`)
    if (!res.ok) return { country: 'Unknown', region: 'Unknown', city: 'Unknown' }
    const data = await res.json()
    return {
      country: data.country || 'Unknown',
      region: data.regionName || 'Unknown',
      city: data.city || 'Unknown',
    }
  } catch {
    return { country: 'Unknown', region: 'Unknown', city: 'Unknown' }
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  console.log('Redirect handler called with code:', code)

  if (!code) {
    console.log('No code provided, redirecting to /not-found')
    return NextResponse.redirect(new URL('/not-found', req.url))
  }

  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwarded = req.headers.get('x-forwarded-for')
  const clientIp = forwarded?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || 'unknown'

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  const supabaseOptions = accessToken
    ? { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false } }
    : { auth: { persistSession: false, autoRefreshToken: false } }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseOptions
  )

  console.log('Looking up code:', code)
  const { data: qrCode, error } = await supabase
    .from('dynamic_codes')
    .select('id, destination_url, is_active, user_id')
    .eq('short_code', code)
    .single()

  console.log('QR Code lookup result:', qrCode, 'error:', error)

  if (error || !qrCode) {
    console.log('Code not found or error, redirecting to /not-found')
    return NextResponse.redirect(new URL('/not-found', req.url))
  }

  if (!qrCode.is_active) {
    return NextResponse.redirect(new URL('/deactivated', req.url))
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, tier')
    .eq('user_id', qrCode.user_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!subscription) {
    return NextResponse.redirect(new URL(`/expired?code=${code}`, req.url))
  }

  const deviceCategory = parseDeviceCategory(userAgent)
  const { country, region, city } = await geoLookup(clientIp)

  await supabase.from('scan_events').insert({
    code_id: qrCode.id,
    client_ip: clientIp,
    user_agent: userAgent,
    device_category: deviceCategory,
    country,
    region,
    city,
    referrer: req.headers.get('referer') || null,
  })

  return NextResponse.redirect(qrCode.destination_url, 302)
}
