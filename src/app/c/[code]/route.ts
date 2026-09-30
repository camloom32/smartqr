import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

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
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`, {
      next: { revalidate: 3600 },
    } as any)
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

  if (!code) {
    return NextResponse.redirect(new URL('/expired', req.url))
  }

  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwarded = req.headers.get('x-forwarded-for')
  const clientIp = forwarded?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || 'unknown'

  const supabase = await createServerSupabaseClient()

  // Look up the code
  const { data: qrCode, error } = await supabase
    .from('dynamic_codes')
    .select('id, destination_url, is_active, user_id')
    .eq('short_code', code)
    .single()

  if (error || !qrCode) {
    return NextResponse.redirect(new URL('/not-found', req.url))
  }

  if (!qrCode.is_active) {
    return NextResponse.redirect(new URL('/deactivated', req.url))
  }

  // Check if user has an active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, tier')
    .eq('user_id', qrCode.user_id)
    .eq('status', 'active')
    .single()

  const isSubscribed = subscription?.status === 'active'

  if (!isSubscribed) {
    return NextResponse.redirect(new URL(`/expired?code=${code}`, req.url))
  }

  // Log the scan event (async, don't block redirect)
  const deviceCategory = parseDeviceCategory(userAgent)
  const { country, region, city } = await geoLookup(clientIp)

  // Fire and forget the scan log
  Promise.resolve().then(async () => {
    try {
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
    } catch {
      // ignore
    }
  })

  // Redirect to destination
  return NextResponse.redirect(qrCode.destination_url, 302)
}
