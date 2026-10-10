import { watermarkedPngBlobFromImageUrl } from '@/lib/watermarkImage'

/** Copy a product image (with store logo watermark) to the system clipboard. */
export async function copyImageUrlToClipboard(imageUrl: string): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error('Clipboard is not available in this browser.')
  }

  const blob = await watermarkedPngBlobFromImageUrl(imageUrl)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
