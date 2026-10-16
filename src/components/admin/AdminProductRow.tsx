import { AdminProductImagePreview } from '@/components/admin/AdminProductImagePreview'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { CopyProductImageButton } from '@/components/admin/CopyProductImageButton'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { EditProductDialog } from '@/components/admin/EditProductDialog'
import { ProductHideCheckbox } from '@/components/admin/ProductHideCheckbox'
import {
  CHECKBOX_CELL_LABEL_CLASS,
  CHECKBOX_COLUMN_CLASS,
  COPY_COLUMN_CLASS,
  ROW_SELECT_CHECKBOX_CLASS,
} from '@/components/admin/adminTableClasses'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import type { useAdminProductMutations } from '@/hooks/useAdminProductMutations'
import { productAdminFullName } from '@/lib/productDisplayTitle'
import { getProductWatermarkedImageUrl, getPublicImageUrl } from '@/lib/products'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

type AdminProductRowProps = {
  product: Product
  rowIndex: number
  selected: boolean
  /** Rows are hidden while a category is being dragged. */
  collapsed: boolean
  mutations: ReturnType<typeof useAdminProductMutations>
  onSelectedChange: (productId: string, selected: boolean) => void
  onHiddenChange: (productId: string, hidden: boolean) => void
  onSuccess: (detail: AdminSuccessDetail) => void
}

export function AdminProductRow({
  product,
  rowIndex,
  selected,
  collapsed,
  mutations,
  onSelectedChange,
  onHiddenChange,
  onSuccess,
}: AdminProductRowProps) {
  const imageUrl = getPublicImageUrl(product.image_path)
  const watermarkedImageUrl = getProductWatermarkedImageUrl(product.image_path)

  return (
    <TableRow
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'transition-[opacity] duration-150 ease-out motion-reduce:transition-none',
        collapsed && 'hidden',
      )}
    >
      <TableCell className={CHECKBOX_COLUMN_CLASS}>
        <label className={CHECKBOX_CELL_LABEL_CLASS}>
          <Checkbox
            aria-label={`Select ${product.name}`}
            checked={selected}
            className={ROW_SELECT_CHECKBOX_CLASS}
            onCheckedChange={(checked) => onSelectedChange(product.id, Boolean(checked))}
          />
        </label>
      </TableCell>
      <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
        {rowIndex}
      </TableCell>
      <TableCell className="font-mono text-sm tabular-nums">{product.product_key}</TableCell>
      <TableCell>
        {imageUrl ? (
          <AdminProductImagePreview
            imageUrl={imageUrl}
            watermarkedImageUrl={watermarkedImageUrl}
            productCategory={product.category}
            productName={product.name}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-normal">{product.category.trim() || '—'}</TableCell>
      <TableCell className="whitespace-normal">{product.name}</TableCell>
      <TableCell className="whitespace-normal">{product.brand || '—'}</TableCell>
      <TableCell className="font-medium whitespace-normal">
        {productAdminFullName(product.category, product.name, product.brand) || '—'}
      </TableCell>
      <TableCell className="tabular-nums">
        {product.quantity_in_carton > 0 ? product.quantity_in_carton : '—'}
      </TableCell>
      <TableCell className={CHECKBOX_COLUMN_CLASS}>
        <ProductHideCheckbox
          productId={product.id}
          productKey={product.product_key}
          hidden={product.hidden}
          onHiddenChange={onHiddenChange}
          onSuccess={onSuccess}
        />
      </TableCell>
      <TableCell className={COPY_COLUMN_CLASS}>
        <CopyProductImageButton
          imageUrl={imageUrl}
          watermarkedImageUrl={watermarkedImageUrl}
          productLabel={product.product_key}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-center">
          <EditProductDialog
            product={product}
            onOptimisticUpdate={mutations.patchOptimistic}
            onUpdateConfirmed={mutations.confirmUpdated}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-center">
          <DeleteProductButton
            product={product}
            onOptimisticDelete={mutations.removeOptimistic}
            onSuccess={onSuccess}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
