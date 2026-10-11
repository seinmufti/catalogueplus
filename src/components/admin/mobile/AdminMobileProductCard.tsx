import { AdminProductImagePreview } from '@/components/admin/AdminProductImagePreview'
import { CopyProductImageButton } from '@/components/admin/CopyProductImageButton'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { EditProductDialog } from '@/components/admin/EditProductDialog'
import { ProductHideCheckbox } from '@/components/admin/ProductHideCheckbox'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { Checkbox } from '@/components/ui/checkbox'
import { productAdminFullName } from '@/lib/productDisplayTitle'
import { getProductWatermarkedImageUrl, getPublicImageUrl } from '@/lib/products'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

type AdminMobileProductCardProps = {
  product: Product
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  onHiddenChange: (productId: string, hidden: boolean) => void
  onOptimisticUpdate: (productId: string, patch: Product) => () => void
  onUpdateConfirmed: (product: Product) => void
  onOptimisticDelete: (productId: string) => () => void
  onSuccess: (detail: AdminSuccessDetail) => void
}

export function AdminMobileProductCard({
  product,
  selected,
  onSelectedChange,
  onHiddenChange,
  onOptimisticUpdate,
  onUpdateConfirmed,
  onOptimisticDelete,
  onSuccess,
}: AdminMobileProductCardProps) {
  const imageUrl = getPublicImageUrl(product.image_path)
  const watermarkedImageUrl = getProductWatermarkedImageUrl(product.image_path)
  const title = productAdminFullName(product.category, product.name, product.brand)

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card p-3 shadow-sm',
        selected && 'ring-2 ring-primary/40',
        product.hidden && 'opacity-75',
      )}
    >
      <div className="flex gap-3">
        <label className="flex shrink-0 cursor-pointer items-start pt-1">
          <Checkbox
            aria-label={`Select ${product.name}`}
            checked={selected}
            className="size-5"
            onCheckedChange={(checked) => onSelectedChange(Boolean(checked))}
          />
        </label>
        <div className="size-16 shrink-0 overflow-hidden rounded-md [&_button]:size-16 [&_img]:size-16">
          {imageUrl ? (
            <AdminProductImagePreview
              imageUrl={imageUrl}
              watermarkedImageUrl={watermarkedImageUrl}
              productCategory={product.category}
              productName={product.name}
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {product.product_key}
          </p>
          <p dir="rtl" lang="ar" className="line-clamp-2 text-sm font-medium leading-snug">
            {title || product.name}
          </p>
          {product.quantity_in_carton > 0 && (
            <p className="text-xs text-muted-foreground">
              Qty / carton: {product.quantity_in_carton}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-border pt-2">
        <div className="mr-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Hide</span>
          <ProductHideCheckbox
            productId={product.id}
            productKey={product.product_key}
            hidden={product.hidden}
            onHiddenChange={onHiddenChange}
            onSuccess={onSuccess}
          />
        </div>
        <CopyProductImageButton
          imageUrl={imageUrl}
          watermarkedImageUrl={watermarkedImageUrl}
          productLabel={product.product_key}
          className="size-9 shrink-0 px-0"
        />
        <EditProductDialog
          product={product}
          onOptimisticUpdate={onOptimisticUpdate}
          onUpdateConfirmed={onUpdateConfirmed}
          triggerVariant="icon"
        />
        <DeleteProductButton
          product={product}
          onOptimisticDelete={onOptimisticDelete}
          onSuccess={onSuccess}
          triggerVariant="icon"
        />
      </div>
    </article>
  )
}
