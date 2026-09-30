import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

async function generateQR(url: string, fg: string, bg: string, logoBase64?: string) {
  const size = 400
  const margin = 2

  const dataUrl: string = await QRCode.toDataURL(url, {
    width: size,
    margin,
    color: { dark: fg, light: bg },
    errorCorrectionLevel: 'H',
  })

  let pngDataUrl = dataUrl

  if (logoBase64) {
    try {
      const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '')
      const logoBuffer = Buffer.from(base64Data, 'base64')
      const logoResized = await sharp(logoBuffer).resize(80, 80, { fit: 'contain' }).toBuffer()

      const qrBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const qrBuffer = Buffer.from(qrBase64, 'base64')
      const compositeBuffer = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).composite([
        { input: qrBuffer, blend: 'over' },
        {
          input: logoResized,
          blend: 'over',
          top: Math.floor((size - 80) / 2),
          left: Math.floor((size - 80) / 2),
        }
      ]).png().toBuffer()

      pngDataUrl = `data:image/png;base64,${compositeBuffer.toString('base64')}`
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

  return {
    svg: svgString,
    png: pngDataUrl,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const fg = searchParams.get('fg') || '#000000'
  const bg = searchParams.get('bg') || '#ffffff'

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const result = await generateQR(url, fg, bg)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}

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
    const result = await generateQR(url, fg, bg, logoBase64)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
