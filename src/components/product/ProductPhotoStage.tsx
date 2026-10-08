import { cn } from '@/lib/utils'

type ProductPhotoStageProps = {
  src: string | null
  alt: string
  className?: string
  /** Thumbnail vs catalogue card aspect container. */
  variant?: 'card' | 'thumb' | 'dialog'
  emptyLabel?: string
}

export function ProductPhotoStage({
  src,
  alt,
  className,
  variant = 'card',
  emptyLabel = 'No image',
}: ProductPhotoStageProps) {
  return (
    <div
      className={cn(
        'product-photo-stage relative overflow-hidden',
        variant === 'thumb' && 'size-full',
        variant === 'dialog' && 'min-h-[min(60vh,28rem)] w-full rounded-md',
        className,
      )}
    >
      <div className="product-photo-stage-light" aria-hidden />
      <div className="product-photo-stage-table" aria-hidden />
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'product-photo-stage-img',
            variant === 'thumb' && 'p-[12%]',
            variant === 'dialog' && 'p-[8%]',
          )}
          draggable={false}
        />
      ) : (
        <span className="relative z-[1] flex size-full items-center justify-center text-xs text-neutral-500">
          {emptyLabel}
        </span>
      )}
    </div>
  )
}
