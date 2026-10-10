import { STORE_LOGO_SRC } from '@/components/StoreLogo'

let watermarkLogoPromise: Promise<HTMLImageElement> | null = null
let watermarkLogoDataUrlPromise: Promise<string> | null = null

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image.'))
    img.src = url
  })
}

/** Near-white pixels that can belong to the outer matte (not inner logo art). */
function isOuterMattePixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) return true
  return r >= 228 && g >= 228 && b >= 228
}

/** Flood-fill from image edges; only outer white becomes transparent. */
function removeOuterWhiteBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const total = width * height
  const outer = new Uint8Array(total)
  const queue: number[] = []

  const pushIfMatte = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const i = y * width + x
    if (outer[i]) return
    const p = i * 4
    if (!isOuterMattePixel(pixels[p]!, pixels[p + 1]!, pixels[p + 2]!, pixels[p + 3]!)) return
    outer[i] = 1
    queue.push(i)
  }

  for (let x = 0; x < width; x++) {
    pushIfMatte(x, 0)
    pushIfMatte(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    pushIfMatte(0, y)
    pushIfMatte(width - 1, y)
  }

  while (queue.length > 0) {
    const i = queue.pop()!
    const x = i % width
    const y = (i - x) / width
    pushIfMatte(x - 1, y)
    pushIfMatte(x + 1, y)
    pushIfMatte(x, y - 1)
    pushIfMatte(x, y + 1)
  }

  for (let i = 0; i < total; i++) {
    if (!outer[i]) continue
    pixels[i * 4 + 3] = 0
  }
}

/** Remove outer white matte from the store PNG; keep inner whites (text, letter A, etc.). */
async function loadWatermarkLogoImage(): Promise<HTMLImageElement> {
  const raw = await loadImage(STORE_LOGO_SRC)
  const canvas = document.createElement('canvas')
  canvas.width = raw.naturalWidth
  canvas.height = raw.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare watermark logo.')
  ctx.drawImage(raw, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  removeOuterWhiteBackground(imageData.data, canvas.width, canvas.height)
  ctx.putImageData(imageData, 0, 0)
  return loadImage(canvas.toDataURL('image/png'))
}

export function getWatermarkLogoImage(): Promise<HTMLImageElement> {
  if (!watermarkLogoPromise) {
    watermarkLogoPromise = loadWatermarkLogoImage()
  }
  return watermarkLogoPromise
}

/** Data URL for transparent watermark logo (UI overlay). */
export function getWatermarkLogoDataUrl(): Promise<string> {
  if (!watermarkLogoDataUrlPromise) {
    watermarkLogoDataUrlPromise = getWatermarkLogoImage().then((img) => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not prepare watermark logo.')
      ctx.drawImage(img, 0, 0)
      return canvas.toDataURL('image/png')
    })
  }
  return watermarkLogoDataUrlPromise
}

/** Draw product image with centered store logo watermark onto canvas. */
export async function drawWatermarkedImage(
  ctx: CanvasRenderingContext2D,
  productImage: HTMLImageElement,
  logo: HTMLImageElement,
): Promise<void> {
  const { width, height } = ctx.canvas
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(productImage, 0, 0, width, height)

  const base = Math.min(width, height)
  const logoWidth = base * 0.52
  const logoHeight = (logo.naturalHeight / logo.naturalWidth) * logoWidth
  const x = (width - logoWidth) / 2
  const y = (height - logoHeight) / 2

  ctx.save()
  ctx.globalAlpha = 0.28
  ctx.drawImage(logo, x, y, logoWidth, logoHeight)
  ctx.restore()
}

export async function watermarkedPngBlobFromImageUrl(imageUrl: string): Promise<Blob> {
  const [productImage, logo] = await Promise.all([
    loadImage(imageUrl),
    getWatermarkLogoImage(),
  ])
  const canvas = document.createElement('canvas')
  canvas.width = productImage.naturalWidth
  canvas.height = productImage.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare image for watermark.')
  await drawWatermarkedImage(ctx, productImage, logo)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  )
  if (!blob) throw new Error('Could not create watermarked image.')
  return blob
}
