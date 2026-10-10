import { useEffect, useState } from 'react'
import { getWatermarkLogoDataUrl } from '@/lib/watermarkImage'
import { cn } from '@/lib/utils'

type ProductImageWithWatermarkProps = {
  src: string
  alt: string
  className?: string
  containerClassName?: string
}

/** Product photo with transparent store logo watermark centered on the image. */
export function ProductImageWithWatermark({
  src,
  alt,
  className,
  containerClassName,
}: ProductImageWithWatermarkProps) {
  const [watermarkSrc, setWatermarkSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getWatermarkLogoDataUrl().then((url) => {
      if (!cancelled) setWatermarkSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={cn('relative size-full overflow-hidden', containerClassName)}>
      <img src={src} alt={alt} className={cn('size-full', className)} />
      {watermarkSrc ? (
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
