import { Card, CardContent } from '@/components/ui/card'
import { productDisplayTitle } from '@/lib/productDisplayTitle'
import { getPublicImageUrl } from '@/lib/products'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

type CustomerProductCardProps = {
  product: Product
  /** When false, title is completion only (category is in the section header). */
  showCategoryInTitle?: boolean
  fillCell?: boolean
}

export function CustomerProductCard({
  product,
  showCategoryInTitle = false,
  fillCell = false,
}: CustomerProductCardProps) {
  const imageUrl = getPublicImageUrl(product.image_path)
  const displayName = productDisplayTitle(product.category, product.name)
  const title = showCategoryInTitle ? displayName : product.name.trim() || displayName

  return (
    <Card
      className={cn(
        'flex flex-col gap-0 border-border/60 py-0 shadow-none',
        fillCell ? 'h-full min-h-0' : 'h-auto',
      )}
    >
      <CardContent
        className={cn(
          'grid gap-1 p-1.5',
          fillCell ? 'h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]' : 'grid-rows-[auto_auto]',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden',
            fillCell ? 'min-h-0' : 'min-h-[4.5rem]',
          )}
        >
          <div className="aspect-[5/4] w-[76%] max-w-full overflow-hidden rounded-md bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt={displayName} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>
        </div>
        <div className="space-y-0.5 pb-0.5">
          <p className="line-clamp-2 text-sm leading-snug font-medium">{title}</p>
          {!showCategoryInTitle && product.brand.trim() ? (
            <p className="truncate text-xs text-muted-foreground">{product.brand}</p>
          ) : null}
          <p className="text-xs tabular-nums text-muted-foreground">
            {product.quantity_in_carton} / carton
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
