import QRCode from 'qrcode'
import sharp from 'sharp'

export interface QRCodeStyle {
  foregroundColor?: string
  backgroundColor?: string
}

export async function generateQRCode(
  destinationUrl: string,
  style: QRCodeStyle = {}
): Promise<{ png: Buffer; svg: string }> {
  const {
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
  } = style

  const opts: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    width: 1024,
    margin: 2,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    errorCorrectionLevel: 'H',
  }

  const svg = await QRCode.toString(destinationUrl, opts)

  const png = await QRCode.toBuffer(destinationUrl, {
    ...opts,
    type: 'png',
    width: 1024,
  })

  return { png, svg }
}

export async function generateQRWithLogo(
  destinationUrl: string,
  style: QRCodeStyle,
  logoBuffer: Buffer,
  logoSize: number = 200
): Promise<{ png: Buffer; svg: string }> {
  const { png: qrBuffer } = await generateQRCode(destinationUrl, style)

  const qrImage = sharp(qrBuffer)
  const metadata = await qrImage.metadata()
  const size = metadata.width || 1024

  const logoResized = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  const logoWithPadding = await sharp({
    create: {
      width: logoSize + 20,
      height: logoSize + 20,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoResized, gravity: 'center' }])
    .png()
    .toBuffer()

  const finalBuffer = await qrImage
    .composite([{ input: logoWithPadding, gravity: 'center' }])
    .png()
    .toBuffer()

  return { png: finalBuffer, svg: '' }
}

export function generateShortCode(length: number = 6): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
