import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

async function generateQRWithFrame(
  url: string,
  fg: string,
  bg: string,
  logoBase64?: string,
  frame?: string,
  caption?: string,
  subcaption?: string,
) {
  const size = 400
  const margin = 3

  const dataUrl: string = await QRCode.toDataURL(url, {
    width: size,
    margin,
    color: { dark: fg, light: bg },
    errorCorrectionLevel: 'H',
  })

  const qrBuffer = Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')

  let finalBuffer: Buffer = qrBuffer

  if (logoBase64) {
    try {
      const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '')
      const logoBuffer = Buffer.from(base64Data, 'base64')
      const logoSize = 70
      const padding = 10
      const logoResized = await sharp(logoBuffer).resize(logoSize, logoSize, { fit: 'contain' }).png().toBuffer()

      const paddedLogo = await sharp({
        create: {
          width: logoSize + padding * 2,
          height: logoSize + padding * 2,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      }).composite([{ input: logoResized, gravity: 'center' }]).png().toBuffer()

      finalBuffer = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).composite([
        { input: qrBuffer, blend: 'over' },
        {
          input: paddedLogo,
          blend: 'over',
          top: Math.floor((size - (logoSize + padding * 2)) / 2),
          left: Math.floor((size - (logoSize + padding * 2)) / 2),
        }
      ]).png().toBuffer()
    } catch {
      // logo failed, use plain QR
    }
  }

  const svgString = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    margin,
    color: { dark: fg, light: bg },
    errorCorrectionLevel: 'H',
  })

  if (frame && frame !== 'none') {
    try {
      if (frame === 'border') {
        const padded = await sharp({
          create: {
            width: size + 20,
            height: size + 20,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([
          { input: finalBuffer, blend: 'over', top: 10, left: 10 }
        ]).png().toBuffer()

        const bordered = await sharp(padded).extend({
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        }).png().toBuffer()

        return { svg: svgString, png: `data:image/png;base64,${bordered.toString('base64')}` }
      }

      if (frame === 'rounded') {
        const roundedBuffer = await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([{ input: finalBuffer, blend: 'over' }]).png().toBuffer()

        const maskSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" rx="40" ry="40" fill="white"/>
        </svg>`

        const maskBuffer = await sharp(Buffer.from(maskSvg)).png().toBuffer()
        const maskMeta = await sharp(maskBuffer).metadata()

        const rounded = await sharp(roundedBuffer)
          .composite([{ input: maskBuffer, blend: 'dest-in' }])
          .png()
          .toBuffer()

        return { svg: svgString, png: `data:image/png;base64,${rounded.toString('base64')}` }
      }

      if (frame === 'caption-bottom') {
        const bannerHeight = caption ? 60 : 0
        const totalHeight = size + bannerHeight + 20

        const canvas = await sharp({
          create: {
            width: size,
            height: totalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([
          { input: finalBuffer, blend: 'over', top: 10, left: Math.floor((size - size) / 2) }
        ]).png().toBuffer()

        if (caption) {
          const textSvg = `<svg width="${size}" height="${bannerHeight + 20}">
            <rect width="${size}" height="${totalHeight}" fill="white"/>
            <rect x="0" y="0" width="${size}" height="${totalHeight}" fill="white"/>
            <text x="${size / 2}" y="${size + bannerHeight / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1a1a1a">${escapeXml(caption)}</text>
          </svg>`

          const combined = await sharp({
            create: {
              width: size,
              height: totalHeight,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
          }).composite([
            { input: finalBuffer, blend: 'over', top: 10, left: 0 },
          ]).png().toBuffer()

          const withText = await sharp(combined).extend({
            bottom: bannerHeight + 10,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }).png().toBuffer()

          return { svg: svgString, png: `data:image/png;base64,${withText.toString('base64')}` }
        }
        return { svg: svgString, png: `data:image/png;base64,${finalBuffer.toString('base64')}` }
      }

      if (frame === 'caption-top-bottom' && caption && subcaption) {
        const bannerHeight = 50
        const totalHeight = size + bannerHeight * 2 + 20

        const combined = await sharp({
          create: {
            width: size,
            height: totalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([
          { input: finalBuffer, blend: 'over', top: bannerHeight + 10, left: 0 },
        ]).png().toBuffer()

        const withText = await sharp(combined).extend({
          top: bannerHeight + 10,
          bottom: bannerHeight + 10,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }).png().toBuffer()

        return { svg: svgString, png: `data:image/png;base64,${withText.toString('base64')}` }
      }

      if (frame === 'banner-sides') {
        const sideWidth = 120
        const totalWidth = size + sideWidth * 2

        const combined = await sharp({
          create: {
            width: totalWidth,
            height: size,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([
          { input: finalBuffer, blend: 'over', top: 0, left: sideWidth },
        ]).png().toBuffer()

        return { svg: svgString, png: `data:image/png;base64,${combined.toString('base64')}` }
      }

      if (frame === 'badge-corner') {
        const badgeSize = 100
        const badgeMargin = 15

        const combined = await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([
          { input: finalBuffer, blend: 'over' },
        ]).png().toBuffer()

        const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${badgeSize}" height="${badgeSize}">
          <circle cx="${badgeSize / 2}" cy="${badgeSize / 2}" r="${badgeSize / 2}" fill="#2563eb"/>
          <text x="${badgeSize / 2}" y="${badgeSize / 2 + 8}" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="white">SCAN</text>
        </svg>`

        const badgeBuffer = await sharp(Buffer.from(badgeSvg)).png().toBuffer()

        const withBadge = await sharp(combined).composite([
          {
            input: badgeBuffer,
            blend: 'over',
            top: size - badgeSize - badgeMargin,
            left: size - badgeSize - badgeMargin,
          }
        ]).png().toBuffer()

        return { svg: svgString, png: `data:image/png;base64,${withBadge.toString('base64')}` }
      }
    } catch (err) {
      console.error('Frame error:', err)
    }
  }

  return {
    svg: svgString,
    png: `data:image/png;base64,${finalBuffer.toString('base64')}`,
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
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

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const result = await generateQRWithFrame(url, fg, bg, logo, frame, caption, subcaption)
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { url, fg, bg, logo, frame, caption, subcaption } = body

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const result = await generateQRWithFrame(url, fg, bg, logo, frame, caption, subcaption)
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
