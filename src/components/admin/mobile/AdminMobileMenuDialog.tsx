import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AdminChangePasswordDialog } from '@/components/admin/AdminChangePasswordDialog'
import { CataloguePreviewDialog } from '@/components/admin/CataloguePreviewDialog'
import { DeleteSelectedProductsButton } from '@/components/admin/DeleteSelectedProductsButton'
import { DownloadBackupButton } from '@/components/admin/DownloadBackupButton'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import type { Product } from '@/types/product'
import { Menu } from 'lucide-react'

type AdminMobileMenuDialogProps = {
  selectedProducts: Product[]
  selectedCount: number
  onSuccess: (detail: AdminSuccessDetail) => void
  onOptimisticDeleteMany: (products: Product[]) => void
  onRestoreProduct: (product: Product) => void
}

export function AdminMobileMenuDialog({
  selectedProducts,
  selectedCount,
  onSuccess,
  onOptimisticDeleteMany,
  onRestoreProduct,
}: AdminMobileMenuDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="icon" aria-label="Admin menu" />}
      >
        <Menu className="size-5" />
      </DialogTrigger>
      <DialogContent className="max-w-[min(100vw-2rem,24rem)]">
        <DialogHeader>
          <DialogTitle>Admin menu</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {selectedCount > 0 && (
            <DeleteSelectedProductsButton
              products={selectedProducts}
              disabled={false}
              onSuccess={(detail) => {
                onSuccess(detail)
                setOpen(false)
              }}
              onOptimisticDeleteMany={onOptimisticDeleteMany}
              onRestoreProduct={onRestoreProduct}
            />
          )}
          <DownloadBackupButton />
          <AdminChangePasswordDialog />
          <CataloguePreviewDialog />
        </div>
      </DialogContent>
    </Dialog>
  )
}
