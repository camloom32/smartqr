import { NextRequest, NextResponse } from 'next/server'
import { QRCodeStyling, DotType } from '@liquid-js/qr-code-styling'
import sharp from 'sharp'

const DOT_TYPE_STRINGS: string[] = Object.values(DotType)

function getDotType(style: string): DotType {
  if (DOT_TYPE_STRINGS.includes(style)) return style as DotType
  return DotType.square
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const fg = searchParams.get('fg') || '#000000'
  const bg = searchParams.get('bg') || '#ffffff'
  const logo = searchParams.get('logo') || undefined
  const frame = searchParams.get('frame') || 'none'
  const caption = searchParams.get('caption') || undefined
  const subcaption = searchParams.get('subcaption') || undefined
  const style = searchParams.get('style') || 'square'

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const result = await generateQR(url, fg, bg, logo, frame, caption, subcaption, style)
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { url, fg, bg, logo, frame, caption, subcaption, style } = body

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const result = await generateQR(url, fg, bg, logo, frame, caption, subcaption, style || 'square')
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}

async function generateQR(
  url: string,
  fg: string,
  bg: string,
  logo?: string,
  frame?: string,
  caption?: string,
  subcaption?: string,
  style?: string,
) {
  const dotType = getDotType(style || 'square')
  const size = 400

  const qrOptions: Record<string, unknown> = {
    width: size,
    height: size,
    data: url,
    qrOptions: { errorCorrectionLevel: 'H' },
    dotsOptions: { color: fg, type: dotType },
    backgroundOptions: { color: bg },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrCode = new QRCodeStyling(qrOptions as any)

  const svgResult = await qrCode.serialize()
  if (!svgResult) throw new Error('Failed to generate SVG')
  const svgString = svgResult

  const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer()
  let pngBase64 = pngBuffer.toString('base64')

  if (logo) {
    pngBase64 = await compositeLogo(pngBase64, logo, size)
  }

  if (frame && frame !== 'none') {
    pngBase64 = await applyFrame(pngBase64, frame, fg, caption, subcaption, size)
  }

  return {
    svg: svgString,
    png: `data:image/png;base64,${pngBase64}`,
    dotType,
  }
}

async function compositeLogo(qrBase64: string, logoDataUrl: string, size: number): Promise<string> {
  const qrBuffer = Buffer.from(qrBase64, 'base64')
  const logoBuffer = Buffer.from(logoDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')

  const logoMeta = await sharp(logoBuffer).metadata()
  const maxLogoSize = Math.round(size * 0.22)
  const logoAspect = (logoMeta.width || 100) / (logoMeta.height || 100)
  const logoHeight = logoAspect >= 1 ? Math.round(maxLogoSize / logoAspect) : maxLogoSize
  const logoWidth = logoAspect >= 1 ? maxLogoSize : Math.round(maxLogoSize * logoAspect)

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoWidth, logoHeight)
    .ensureAlpha()
    .png()
    .toBuffer()

  const qrMeta = await sharp(qrBuffer).metadata()
  const qrActualSize = qrMeta.width || size

  const x = Math.round((qrActualSize - logoWidth) / 2)
  const y = Math.round((qrActualSize - logoHeight) / 2)

  const padding = 12
  const bgWidth = logoWidth + padding * 2
  const bgHeight = logoHeight + padding * 2
  const bgX = x - padding
  const bgY = y - padding

  const whiteBg = await sharp({
    create: { width: bgWidth, height: bgHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).png().toBuffer()

  const withBg = await sharp(qrBuffer)
    .composite([{
      input: whiteBg,
      top: bgY,
      left: bgX,
    }])
    .png()
    .toBuffer()

  const withLogo = await sharp(withBg)
    .composite([{
      input: resizedLogo,
      top: y,
      left: x,
    }])
    .png()
    .toBuffer()

  return withLogo.toString('base64')
}

async function applyFrame(
  pngBase64: string,
  frame: string,
  fg: string,
  caption?: string,
  subcaption?: string,
  size = 400,
): Promise<string> {
  const qrBuffer = Buffer.from(pngBase64, 'base64')

  switch (frame) {
    case 'border': {
      const padded = await sharp({
        create: { width: size + 20, height: size + 20, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([{ input: qrBuffer, blend: 'over', top: 10, left: 10 }]).png().toBuffer()

      const bordered = await sharp(padded).extend({
        top: 10, bottom: 10, left: 10, right: 10,
        background: { r: parseInt(fg.slice(1, 3), 16), g: parseInt(fg.slice(3, 5), 16), b: parseInt(fg.slice(5, 7), 16), alpha: 1 },
      }).png().toBuffer()

      return bordered.toString('base64')
    }

    case 'rounded': {
      const maskSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="40" ry="40" fill="white"/>
      </svg>`
      const maskBuffer = await sharp(Buffer.from(maskSvg)).png().toBuffer()

      const withBg = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([{ input: qrBuffer, blend: 'over' }]).png().toBuffer()

      const masked = await sharp(withBg)
        .composite([{ input: maskBuffer, blend: 'dest-in' }])
        .png()
        .toBuffer()

      return masked.toString('base64')
    }

    case 'caption-bottom': {
      if (!caption) return pngBase64
      const bannerHeight = 70
      const totalHeight = size + bannerHeight

      const textSvg = `<svg width="${size}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${bannerHeight}" fill="white"/>
        <text x="${size / 2}" y="${bannerHeight / 2 + 8}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="24" font-weight="bold" fill="${fg}">${escapeXml(caption)}</text>
      </svg>`
      const textBuffer = await sharp(Buffer.from(textSvg)).png().toBuffer()

      const canvas = await sharp({
        create: { width: size, height: totalHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([
        { input: qrBuffer, blend: 'over', top: 0, left: 0 },
        { input: textBuffer, blend: 'over', top: size, left: 0 },
      ]).png().toBuffer()

      return canvas.toString('base64')
    }

    case 'caption-top-bottom': {
      if (!caption || !subcaption) return pngBase64
      const bannerHeight = 50
      const totalHeight = size + bannerHeight * 2

      const topSvg = `<svg width="${size}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${bannerHeight}" fill="white"/>
        <text x="${size / 2}" y="${bannerHeight / 2 + 8}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="22" font-weight="bold" fill="${fg}">${escapeXml(subcaption)}</text>
      </svg>`
      const bottomSvg = `<svg width="${size}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${bannerHeight}" fill="white"/>
        <text x="${size / 2}" y="${bannerHeight / 2 + 8}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="24" font-weight="bold" fill="${fg}">${escapeXml(caption)}</text>
      </svg>`

      const [topBuffer, bottomBuffer] = await Promise.all([
        sharp(Buffer.from(topSvg)).png().toBuffer(),
        sharp(Buffer.from(bottomSvg)).png().toBuffer(),
      ])

      const canvas = await sharp({
        create: { width: size, height: totalHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([
        { input: topBuffer, blend: 'over', top: 0, left: 0 },
        { input: qrBuffer, blend: 'over', top: bannerHeight, left: 0 },
        { input: bottomBuffer, blend: 'over', top: size + bannerHeight, left: 0 },
      ]).png().toBuffer()

      return canvas.toString('base64')
    }

    case 'badge-corner': {
      const badgeSize = 90
      const margin = 12

      const badgeSvg = `<svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${badgeSize / 2}" cy="${badgeSize / 2}" r="${badgeSize / 2}" fill="#2563eb"/>
        <text x="${badgeSize / 2}" y="${badgeSize / 2 + 10}" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="36" font-weight="bold" fill="white">SCAN</text>
      </svg>`
      const badgeBuffer = await sharp(Buffer.from(badgeSvg)).png().toBuffer()

      const canvas = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([
        { input: qrBuffer, blend: 'over' },
        { input: badgeBuffer, blend: 'over', top: size - badgeSize - margin, left: size - badgeSize - margin },
      ]).png().toBuffer()

      return canvas.toString('base64')
    }

    default:
      return pngBase64
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
