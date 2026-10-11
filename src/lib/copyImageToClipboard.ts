import { watermarkedPngBlobFromImageUrl } from '@/lib/watermarkImage'

async function pngBlobFromImageUrl(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error('Could not load watermarked image.')
  const bitmap = await createImageBitmap(await response.blob())
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare image for clipboard.')
    ctx.drawImage(bitmap, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Could not prepare image for clipboard.')
    return blob
  } finally {
    bitmap.close()
  }
}

/** Copy the watermarked product image to the clipboard (never the bare original). */
export async function copyImageUrlToClipboard(
  originalUrl: string,
  watermarkedUrl?: string | null,
): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error('Clipboard is not available in this browser.')
  }

  let blob: Blob
  try {
    if (!watermarkedUrl) throw new Error('No stored watermarked copy.')
    blob = await pngBlobFromImageUrl(watermarkedUrl)
  } catch {
    blob = await watermarkedPngBlobFromImageUrl(originalUrl)
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
