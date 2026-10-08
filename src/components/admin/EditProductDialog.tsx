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
import { BrandCombobox } from '@/components/admin/CategoryCombobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatLoadError } from '@/lib/errors'
import { parseOptionalCartonQuantity } from '@/lib/parseCartonQuantity'
import {
  distinctBrandsFromProducts,
  getPublicImageUrl,
  listProducts,
  updateProduct,
} from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { showAdminSuccessToast } from '@/components/admin/adminSuccessToast'
import type { Product } from '@/types/product'
import { ImagePlus, Pencil } from 'lucide-react'

type EditProductDialogProps = {
  product: Product
  onOptimisticUpdate: (productId: string, patch: Product) => () => void
  onUpdateConfirmed: (product: Product) => void
}

export function EditProductDialog({
  product,
  onOptimisticUpdate,
  onUpdateConfirmed,
}: EditProductDialogProps) {
  const [open, setOpen] = useState(false)
  const inFlightRef = useRef(false)
  const [name, setName] = useState(product.name)
  const [category, setCategory] = useState(product.category)
  const [brand, setBrand] = useState(product.brand)
  const [brandOptions, setBrandOptions] = useState<string[]>([])
  const [quantity, setQuantity] = useState(
    product.quantity_in_carton > 0 ? String(product.quantity_in_carton) : '',
  )
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(product.name)
    setCategory(product.category)
    setBrand(product.brand)
    setQuantity(
      product.quantity_in_carton > 0 ? String(product.quantity_in_carton) : '',
    )
    if (supabaseConfigured) {
      void listProducts()
        .then((rows) => setBrandOptions(distinctBrandsFromProducts(rows)))
        .catch(() => setBrandOptions([]))
    }
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (inFlightRef.current) return
    const qty = parseOptionalCartonQuantity(quantity)
    if (!name.trim() || !category.trim() || qty === null) {
      toast.error('Fill in all fields with valid values.')
      return
    }

    const imageFile = image
    const optimisticImagePath =
      imageFile && previewUrl ? previewUrl : product.image_path

    const optimistic: Product = {
      ...product,
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      quantity_in_carton: qty,
      image_path: optimisticImagePath,
    }

    inFlightRef.current = true
    const revert = onOptimisticUpdate(product.id, optimistic)
    setOpen(false)

    void updateProduct(
      product.id,
      {
        name,
        category,
        brand,
        quantityInCarton: qty,
        image: imageFile,
      },
    )
      .then((updated) => {
        onUpdateConfirmed(updated)
        showAdminSuccessToast({ action: 'edited', productKey: updated.product_key })
      })
      .catch((err) => {
        revert()
        toast.error(formatLoadError(err, 'Could not update product.'))
      })
      .finally(() => {
        inFlightRef.current = false
      })
  }

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
                <Label htmlFor={`edit-name-${product.id}`}>completion</Label>
                <Input
                  id={`edit-name-${product.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <BrandCombobox
                id={`edit-brand-${product.id}`}
                value={brand}
                onChange={setBrand}
                brands={brandOptions}
              />
              <div className="grid gap-2">
                <Label htmlFor={`edit-qty-${product.id}`}>Quantity inside carton</Label>
                <Input
                  id={`edit-qty-${product.id}`}
                  type="number"
                  min={0}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
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
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
