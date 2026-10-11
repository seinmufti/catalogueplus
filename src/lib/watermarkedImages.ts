import type { SupabaseClient } from '@supabase/supabase-js'
import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import { drawWatermarkLogo, getWatermarkLogoImage } from '@/lib/watermarkImage'

/**
 * Originals live at `image_path` and are never modified.
 * Each has a derived watermarked copy at `watermarked/<name>.jpg`.
 */
const WATERMARKED_DIR = 'watermarked'
const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.88
const GENERATE_CONCURRENCY = 3

export function isStoredImagePath(imagePath: string | null): imagePath is string {
  return Boolean(imagePath) && !/^(blob:|https?:)/.test(imagePath!)
}

export function watermarkedImagePath(imagePath: string): string {
  const fileName = imagePath.split('/').pop() ?? imagePath
  return `${WATERMARKED_DIR}/${fileName.replace(/\.[^.]+$/, '')}.jpg`
}

export function getWatermarkedImageUrl(
  client: SupabaseClient,
  imagePath: string | null,
): string | null {
  if (!isStoredImagePath(imagePath)) return null
  const { data } = client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(watermarkedImagePath(imagePath))
  return data.publicUrl
}

/** Build the watermarked JPEG from an original image (the original blob is only read). */
export async function createWatermarkedBlob(original: Blob): Promise<Blob> {
  const [bitmap, logo] = await Promise.all([createImageBitmap(original), getWatermarkLogoImage()])
  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare watermarked image.')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    drawWatermarkLogo(ctx, logo)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) throw new Error('Could not create watermarked image.')
    return blob
  } finally {
    bitmap.close()
  }
}

export async function uploadWatermarkedImage(
  client: SupabaseClient,
  imagePath: string,
  original: Blob,
): Promise<void> {
  const blob = await createWatermarkedBlob(original)
  const { error } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(watermarkedImagePath(imagePath), blob, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    })
  if (error) throw error
}

export async function removeWatermarkedImage(
  client: SupabaseClient,
  imagePath: string | null,
): Promise<void> {
  if (!isStoredImagePath(imagePath)) return
  await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([watermarkedImagePath(imagePath)])
}

async function listWatermarkedFileNames(client: SupabaseClient): Promise<Set<string>> {
  const names = new Set<string>()
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(WATERMARKED_DIR, { limit: pageSize, offset })
    if (error) throw error
    for (const file of data ?? []) names.add(`${WATERMARKED_DIR}/${file.name}`)
    if (!data || data.length < pageSize) return names
  }
}

export type EnsureWatermarksResult = { generated: number; failed: number }

/** Create watermarked copies for any originals that don't have one yet. */
export async function ensureWatermarkedImages(
  client: SupabaseClient,
  imagePaths: (string | null)[],
): Promise<EnsureWatermarksResult> {
  const existing = await listWatermarkedFileNames(client)
  const missing = [...new Set(imagePaths.filter(isStoredImagePath))].filter(
    (path) => !existing.has(watermarkedImagePath(path)),
  )

  const result: EnsureWatermarksResult = { generated: 0, failed: 0 }
  let next = 0
  const worker = async () => {
    while (next < missing.length) {
      const imagePath = missing[next++]!
      try {
        const { data, error } = await client.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .download(imagePath)
        if (error) throw error
        await uploadWatermarkedImage(client, imagePath, data)
        result.generated += 1
      } catch {
        result.failed += 1
      }
    }
  }
  await Promise.all(Array.from({ length: GENERATE_CONCURRENCY }, worker))
  return result
}
