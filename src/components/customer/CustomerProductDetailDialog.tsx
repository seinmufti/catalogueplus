import { ProductImageWithWatermark } from '@/components/ProductImageWithWatermark'
import { useCustomerPhonePortalContainer } from '@/components/customer/CustomerPhonePortalContext'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { productDisplayTitle } from '@/lib/productDisplayTitle'
import { getPublicImageUrl } from '@/lib/products'
import type { Product } from '@/types/product'

type CustomerProductDetailDialogProps = {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProductDetailDialog({
  product,
  open,
  onOpenChange,
}: CustomerProductDetailDialogProps) {
  const phonePortalContainer = useCustomerPhonePortalContainer()
  const imageUrl = getPublicImageUrl(product.image_path)
  const displayName = productDisplayTitle(product.category, product.name)
  const brand = product.brand.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        lang="ar"
        portalContainer={phonePortalContainer ?? undefined}
        className="max-w-[min(22rem,calc(100%-1.25rem))] gap-3 p-3 sm:max-w-md sm:p-4"
      >
        <div className="overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <ProductImageWithWatermark
              src={imageUrl}
              alt={displayName}
              className="object-contain"
              containerClassName="mx-auto aspect-[5/4] max-h-[min(52vh,420px)] w-full"
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <DialogTitle className="text-start text-lg leading-snug font-semibold text-foreground">
          {displayName}
        </DialogTitle>

        {(brand || product.quantity_in_carton > 0) && (
          <div className="space-y-1 text-start text-sm">
            {brand ? <p className="font-medium">{brand}</p> : null}
            {product.quantity_in_carton > 0 ? (
              <p className="tabular-nums text-muted-foreground">
                {product.quantity_in_carton} / carton
              </p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
