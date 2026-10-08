const MAX_DIMENSION = 800
const JPEG_QUALITY = 0.85
const SKIP_BELOW_BYTES = 180_000

/** Resize/compress for catalogue thumbnails — faster uploads to Supabase Storage. */
export async function prepareProductImage(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES && file.type === 'image/jpeg') {
    return file
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  if (scale === 1 && file.size <= SKIP_BELOW_BYTES) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) return file

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'product'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}
