import { NextRequest, NextResponse } from 'next/server'
import { QRCodeStyling, DotType } from '@liquid-js/qr-code-styling'
import sharp from 'sharp'
import { ImageResponse } from '@vercel/og'

const DOT_TYPE_STRINGS: string[] = Object.values(DotType)

function getDotType(style: string): DotType {
  if (DOT_TYPE_STRINGS.includes(style)) return style as DotType
  return DotType.square
}

async function renderTextBanner(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  fontColor: string,
  bgColor = '#ffffff',
): Promise<Buffer> {
  try {
    const response = new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: fontColor,
          fontSize,
          fontWeight: 700,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {text}
      </div>,
      { width, height },
    )
    return Buffer.from(await response.arrayBuffer())
  } catch {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
    </svg>`
    return sharp(Buffer.from(svg)).png().toBuffer()
  }
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
      const borderWidth = 15
      const innerSize = size - borderWidth * 2

      const resized = await sharp(qrBuffer)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer()

      const bordered = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: parseInt(fg.slice(1, 3), 16), g: parseInt(fg.slice(3, 5), 16), b: parseInt(fg.slice(5, 7), 16), alpha: 1 } },
      }).composite([{ input: resized, blend: 'over', top: borderWidth, left: borderWidth }]).png().toBuffer()

      return bordered.toString('base64')
    }

    case 'rounded': {
      const roundedRadius = 40

      const qrFlat = await sharp(qrBuffer)
        .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer()

      const roundedMaskSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${roundedRadius}" ry="${roundedRadius}" fill="white"/>
      </svg>`
      const roundedMaskBuffer = await sharp(Buffer.from(roundedMaskSvg)).png().toBuffer()

      const whiteBg = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).png().toBuffer()

      const rounded = await sharp(whiteBg)
        .composite([
          { input: qrFlat, blend: 'over' },
          { input: roundedMaskBuffer, blend: 'dest-in' },
        ])
        .png()
        .toBuffer()

      return rounded.toString('base64')
    }

    case 'caption-bottom': {
      if (!caption) return pngBase64
      const bannerHeight = 80
      const totalHeight = size + bannerHeight

      const textBuffer = await renderTextBanner(caption, size, bannerHeight, 28, fg)

      const resultCanvas = await sharp({
        create: { width: size, height: totalHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([
        { input: qrBuffer, blend: 'over', top: 0, left: 0 },
        { input: textBuffer, blend: 'over', top: size, left: 0 },
      ]).png().toBuffer()

      return resultCanvas.toString('base64')
    }

    case 'caption-top-bottom': {
      if (!caption || !subcaption) return pngBase64
      const bannerHeight = 60
      const totalHeight = size + bannerHeight * 2

      const [topBuffer, bottomBuffer] = await Promise.all([
        renderTextBanner(subcaption, size, bannerHeight, 26, fg),
        renderTextBanner(caption, size, bannerHeight, 26, fg),
      ])

      const resultCanvas = await sharp({
        create: { width: size, height: totalHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([
        { input: topBuffer, blend: 'over', top: 0, left: 0 },
        { input: qrBuffer, blend: 'over', top: bannerHeight, left: 0 },
        { input: bottomBuffer, blend: 'over', top: size + bannerHeight, left: 0 },
      ]).png().toBuffer()

      return resultCanvas.toString('base64')
    }

    case 'badge-corner': {
      const badgeSize = 90
      const margin = 12

      const badgeTextBuffer = await renderTextBanner('SCAN', badgeSize, badgeSize, 28, '#ffffff', '#2563eb')

      const badgeSvg = `<svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${badgeSize / 2}" cy="${badgeSize / 2}" r="${badgeSize / 2}" fill="#2563eb"/>
      </svg>`
      const badgeBgBuffer = await sharp(Buffer.from(badgeSvg)).png().toBuffer()

      const badgeBg = await sharp(badgeBgBuffer)
        .composite([{ input: badgeTextBuffer, blend: 'over' }])
        .png()
        .toBuffer()

      const resultCanvas = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      }).composite([
        { input: qrBuffer, blend: 'over' },
        { input: badgeBg, blend: 'over', top: size - badgeSize - margin, left: size - badgeSize - margin },
      ]).png().toBuffer()

      return resultCanvas.toString('base64')
    }

    default:
      return pngBase64
  }
}


