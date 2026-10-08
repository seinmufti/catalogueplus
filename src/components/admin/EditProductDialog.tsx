import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatLoadError } from '@/lib/errors'
import { getPublicImageUrl, updateProduct } from '@/lib/products'
import { cn } from '@/lib/utils'
import { showAdminSuccessToast } from '@/components/admin/adminSuccessToast'
import type { Product } from '@/types/product'
import { ImagePlus, Pencil } from 'lucide-react'

type EditProductDialogProps = {
  product: Product
  onUpdated: () => void
}

export function EditProductDialog({ product, onUpdated }: EditProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<'upload' | 'save' | null>(null)
  const [name, setName] = useState(product.name)
  const [category, setCategory] = useState(product.category)
  const [quantity, setQuantity] = useState(String(product.quantity_in_carton))
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(product.name)
    setCategory(product.category)
    setQuantity(String(product.quantity_in_carton))
    setImage(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    setPreviewUrl(getPublicImageUrl(product.image_path))
  }, [open, product])

  useEffect(() => {
    if (!image) return
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = Number.parseInt(quantity, 10)
    if (!name.trim() || !category.trim() || Number.isNaN(qty) || qty < 0) {
      toast.error('Fill in all fields with valid values.')
      return
    }

    setSubmitting(true)
    setSubmitPhase('upload')
    try {
      await updateProduct(
        product.id,
        {
          name,
          category,
          quantityInCarton: qty,
          image,
        },
        { onPhase: setSubmitPhase },
      )
      showAdminSuccessToast({ action: 'edited', productKey: product.product_key })
      setOpen(false)
      onUpdated()
    } catch (err) {
      toast.error(formatLoadError(err, 'Could not update product.'))
    } finally {
      setSubmitting(false)
      setSubmitPhase(null)
    }
  }

  const submitLabel = submitting
    ? submitPhase === 'save'
      ? 'Saving…'
      : 'Uploading image…'
    : 'Save changes'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" />
        Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor={`edit-category-${product.id}`}>Category</Label>
                <Input
                  id={`edit-category-${product.id}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-name-${product.id}`}>Name</Label>
                <Input
                  id={`edit-name-${product.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-qty-${product.id}`}>Quantity inside carton</Label>
                <Input
                  id={`edit-qty-${product.id}`}
                  type="number"
                  min={0}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-image-${product.id}`}>Image</Label>
                <input
                  ref={imageInputRef}
                  id={`edit-image-${product.id}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={cn(
                    'relative mx-auto flex size-36 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors',
                    'hover:border-primary/50 hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  )}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="" className="size-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[10px] font-medium text-white">
                        Change
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-2 text-muted-foreground">
                      <ImagePlus className="size-7 stroke-[1.25]" aria-hidden />
                      <span className="text-center text-[11px] font-medium leading-tight text-foreground">
                        Choose image
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
