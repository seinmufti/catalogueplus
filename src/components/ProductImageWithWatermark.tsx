import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getWatermarkLogoDataUrl } from '@/lib/watermarkImage'
import { cn } from '@/lib/utils'

type ProductImageWithWatermarkProps = {
  /** Original image URL (or a local blob preview). */
  src: string
  /** Pre-generated watermarked copy; falls back to `src` + overlay if it fails to load. */
  watermarkedSrc?: string | null
  alt: string
  className?: string
  containerClassName?: string
  /** Load immediately (e.g. detail modal). Default lazy for grid thumbnails. */
  priority?: boolean
}

/** Product photo shown with the store logo watermark. */
export function ProductImageWithWatermark({
  src,
  watermarkedSrc,
  alt,
  className,
  containerClassName,
  priority = false,
}: ProductImageWithWatermarkProps) {
  const [watermarkSrc, setWatermarkSrc] = useState<string | null>(null)
  const [photoReady, setPhotoReady] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [watermarkedFailed, setWatermarkedFailed] = useState(false)

  const useStoredCopy = Boolean(watermarkedSrc) && !watermarkedFailed
  const displaySrc = useStoredCopy ? watermarkedSrc! : src

  useEffect(() => {
    if (useStoredCopy) return
    let cancelled = false
    void getWatermarkLogoDataUrl().then((url) => {
      if (!cancelled) setWatermarkSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [useStoredCopy])

  useEffect(() => {
    setPhotoReady(false)
    setPhotoError(false)
    setWatermarkedFailed(false)
  }, [src, watermarkedSrc])

  return (
    <div className={cn('relative size-full overflow-hidden', containerClassName)}>
      {!photoReady && !photoError ? (
        <Skeleton className="absolute inset-0 size-full rounded-none" aria-hidden />
      ) : null}
      {photoError ? (
        <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
          No image
        </div>
      ) : (
        <img
          key={displaySrc}
          src={displaySrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setPhotoReady(true)}
          onError={() => {
            if (useStoredCopy) setWatermarkedFailed(true)
            else setPhotoError(true)
          }}
          className={cn(
            'size-full transition-opacity duration-200',
            className,
            photoReady ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
      {photoReady && !useStoredCopy && watermarkSrc ? (
        <img
          src={watermarkSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 max-h-[52%] max-w-[62%] min-h-4 min-w-4 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.28] drop-shadow-sm"
        />
      ) : null}
    </div>
  )
}
