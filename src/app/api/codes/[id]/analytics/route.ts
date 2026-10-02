import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: codeId } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseOptions = {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseOptions
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: code } = await supabase
    .from('dynamic_codes')
    .select('id')
    .eq('id', codeId)
    .eq('user_id', user.id)
    .single()

  if (!code) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: scanEvents, error } = await supabase
    .from('scan_events')
    .select('created_at, device_category, country, region, city, referrer')
    .eq('code_id', codeId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 })
  }

  const allTimeScans = await supabase
    .from('scan_events')
    .select('created_at, device_category, country, region, city, referrer')
    .eq('code_id', codeId)

  const allScans = allTimeScans.data || []

  const timeline: { date: string; scans: number }[] = []
  const timelineMap: Record<string, number> = {}
  for (const scan of (scanEvents || [])) {
    const date = scan.created_at.split('T')[0]
    timelineMap[date] = (timelineMap[date] || 0) + 1
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    timeline.push({ date: dateStr, scans: timelineMap[dateStr] || 0 })
  }

  const deviceMap: Record<string, number> = {}
  for (const scan of allScans) {
    const device = scan.device_category || 'other'
    deviceMap[device] = (deviceMap[device] || 0) + 1
  }
  const deviceBreakdown = Object.entries(deviceMap).map(([name, value]) => ({
    name: name.replace('mobile_', '').replace('_', ' '),
    value,
    label: name,
  }))

  const locationMap: Record<string, { city: string; country: string; count: number }> = {}
  for (const scan of allScans) {
    const key = `${scan.city || 'Unknown'}|${scan.country || 'Unknown'}`
    if (!locationMap[key]) {
      locationMap[key] = { city: scan.city || 'Unknown', country: scan.country || 'Unknown', count: 0 }
    }
    locationMap[key].count++
  }
  const topLocations = Object.values(locationMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const referrerMap: Record<string, number> = {}
  for (const scan of allScans) {
    const ref = scan.referrer || 'Direct'
    referrerMap[ref] = (referrerMap[ref] || 0) + 1
  }
  const topReferrers = Object.entries(referrerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }))

  const scanLocations = allScans
    .filter(s => s.country && s.country !== 'Unknown')
    .map(s => ({
      country: s.country,
      city: s.city,
      count: 1,
    }))

  return NextResponse.json({
    timeline,
    deviceBreakdown,
    topLocations,
    topReferrers,
    scanLocations,
    totalScans: allScans.length,
  })
}
