import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json()

  if (!access_token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  if (refresh_token) {
    cookieStore.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return NextResponse.json({ success: true })
}
