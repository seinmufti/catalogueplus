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

type DeleteProductButtonProps = {
  product: Product
  onDeleted: () => void
  onSuccess?: (detail: AdminSuccessDetail) => void
}

export function DeleteProductButton({ product, onDeleted, onSuccess }: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      onSuccess?.({ action: 'deleted', productKey: product.product_key })
      setOpen(false)
      onDeleted()
    } catch (err) {
      toast.error(formatLoadError(err, 'Could not delete product.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-3.5" />
        Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{product.name}</span> from the
            catalogue? This cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
