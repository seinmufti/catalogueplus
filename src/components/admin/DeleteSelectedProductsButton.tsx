import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { formatLoadError } from '@/lib/errors'
import { deleteProduct } from '@/lib/products'
import type { Product } from '@/types/product'
import { Trash2 } from 'lucide-react'

type DeleteSelectedProductsButtonProps = {
  products: Product[]
  disabled?: boolean
  onOptimisticDeleteMany: (products: Product[]) => void
  onRestoreProduct: (product: Product) => void
  onSuccess?: (detail: AdminSuccessDetail) => void
}

export function DeleteSelectedProductsButton({
  products,
  disabled,
  onOptimisticDeleteMany,
  onRestoreProduct,
  onSuccess,
}: DeleteSelectedProductsButtonProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const count = products.length
  const enabled = !disabled && count > 0

  async function confirmDelete() {
    const snapshot = [...products]
    onOptimisticDeleteMany(snapshot)
    setOpen(false)
    setDeleting(true)

    try {
      for (const product of snapshot) {
        try {
          await deleteProduct(product.id)
          onSuccess?.({ action: 'deleted', productKey: product.product_key })
        } catch (err) {
          onRestoreProduct(product)
          toast.error(
            formatLoadError(err, `Could not delete ${product.product_key} — ${product.name}.`),
          )
        }
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="size-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={!enabled || deleting}
        aria-label="Delete selected products"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete {count === 1 ? 'product' : `${count} products`}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove the selected {count === 1 ? 'item' : 'items'} from the catalogue? This cannot be
            undone.
          </p>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
