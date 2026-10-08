import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
        className="block cursor-pointer overflow-hidden rounded-md border transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        render={<button type="button" className="cursor-pointer" />}
      >
        <img
          src={imageUrl}
          alt=""
          className="size-14 cursor-pointer object-cover"
        />
      </DialogTrigger>
      <DialogContent className="max-w-[min(42rem,calc(100%-2rem))] gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <img
          src={imageUrl}
          alt={title}
          className="max-h-[min(80vh,720px)] w-full rounded-md object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}
