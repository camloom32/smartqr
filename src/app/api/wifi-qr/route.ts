import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

const WIFI_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="80" r="8" fill="#1a1a1a"/>
  <path d="M15 55 Q50 20 85 55" stroke="#1a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M25 65 Q50 38 75 65" stroke="#1a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M35 75 Q50 55 65 75" stroke="#1a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ssid, password, encryption, hidden } = body

  if (!ssid) {
    return NextResponse.json({ error: 'SSID required' }, { status: 400 })
  }

  try {
    const wifiString = `WIFI:T:${encryption || 'WPA'};S:${ssid};P:${password || ''};H:${hidden ? 'true' : 'false'};;`

    const pngBuffer = await QRCode.toBuffer(wifiString, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })

    let finalBuffer = pngBuffer

    try {
      const iconBuffer = Buffer.from(WIFI_ICON_SVG)
      const iconResized = await sharp(iconBuffer).resize(60, 60, { fit: 'contain' }).png().toBuffer()

      finalBuffer = await sharp({
        create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
      }).composite([
        { input: pngBuffer, blend: 'over' },
        { input: iconResized, blend: 'over', top: 170, left: 170 }
      ]).png().toBuffer()
    } catch {
      // logo overlay failed, return QR without logo
    }

    return NextResponse.json({
      png: `data:image/png;base64,${finalBuffer.toString('base64')}`,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
