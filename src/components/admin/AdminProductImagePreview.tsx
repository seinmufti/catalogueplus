import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProductPhotoStage } from '@/components/product/ProductPhotoStage'
import { productDisplayTitle } from '@/lib/productDisplayTitle'

type AdminProductImagePreviewProps = {
  imageUrl: string
  productCategory: string
  productName: string
}

export function AdminProductImagePreview({
  imageUrl,
  productCategory,
  productName,
}: AdminProductImagePreviewProps) {
  const [open, setOpen] = useState(false)
  const title = productDisplayTitle(productCategory, productName)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={`View image for ${title}`}
        className="block size-14 cursor-pointer overflow-hidden rounded-md border transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        render={<button type="button" className="cursor-pointer" />}
      >
        <ProductPhotoStage src={imageUrl} alt="" variant="thumb" />
      </DialogTrigger>
      <DialogContent className="max-w-[min(42rem,calc(100%-2rem))] gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ProductPhotoStage src={imageUrl} alt={title} variant="dialog" />
      </DialogContent>
    </Dialog>
  )
}
