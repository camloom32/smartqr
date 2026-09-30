import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const fg = searchParams.get('fg') || '#000000'
  const bg = searchParams.get('bg') || '#ffffff'

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: 'H',
    })

    const png = await QRCode.toBuffer(url, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: 'H',
    })

    return NextResponse.json({
      svg,
      png: `data:image/png;base64,${png.toString('base64')}`,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
