import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const url = body.url
  const fg = body.fg || '#000000'
  const bg = body.bg || '#ffffff'
  const logoBase64 = body.logo

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const size = 400
    const margin = 2

    let pngBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: size,
      margin,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: 'H',
    })

    if (logoBase64) {
      try {
        const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '')
        const logoBuffer = Buffer.from(base64Data, 'base64')
        const logoResized = await sharp(logoBuffer).resize(80, 80, { fit: 'contain' }).toBuffer()
        pngBuffer = await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        }).composite([
          { input: pngBuffer, blend: 'over' },
          {
            input: logoResized,
            blend: 'over',
            top: Math.floor((size - 80) / 2),
            left: Math.floor((size - 80) / 2),
          }
        ]).png().toBuffer()
      } catch {
        // logo overlay failed, return QR without logo
      }
    }

    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: 'H',
    })

    return NextResponse.json({
      svg: svgString,
      png: `data:image/png;base64,${pngBuffer.toString('base64')}`,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
