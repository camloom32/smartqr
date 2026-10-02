import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: codeId } = await params
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'csv'

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
    .select('title, short_code')
    .eq('id', codeId)
    .eq('user_id', user.id)
    .single()

  if (!code) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: scans } = await supabase
    .from('scan_events')
    .select('created_at, device_category, country, region, city, referrer')
    .eq('code_id', codeId)
    .order('created_at', { ascending: false })

  if (!scans || scans.length === 0) {
    return NextResponse.json({ error: 'No scan data to export' }, { status: 404 })
  }

  const filename = `scan-history-${code.short_code}`

  if (format === 'json') {
    const exportData = {
      code: code.title || code.short_code,
      shortCode: code.short_code,
      exportedAt: new Date().toISOString(),
      totalScans: scans.length,
      scans: scans.map(s => ({
        timestamp: s.created_at,
        device: s.device_category,
        city: s.city,
        country: s.country,
        referrer: s.referrer || 'Direct',
      })),
    }
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}.json"`,
        'Content-Type': 'application/json',
      },
    })
  }

  const headers = ['Timestamp', 'Device', 'City', 'Country', 'Referrer']
  const rows = scans.map(s => [
    s.created_at,
    s.device_category || 'unknown',
    s.city || 'Unknown',
    s.country || 'Unknown',
    s.referrer || 'Direct',
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'Content-Type': 'text/csv',
    },
  })
}
