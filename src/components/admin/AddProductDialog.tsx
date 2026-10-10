import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BrandCombobox, CategoryCombobox } from '@/components/admin/CategoryCombobox'
import { ProductImageWithWatermark } from '@/components/ProductImageWithWatermark'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { loadDummyProductImage, nextDummyProductFields } from '@/lib/dummyProduct'
import { formatLoadError } from '@/lib/errors'
import { parseOptionalCartonQuantity } from '@/lib/parseCartonQuantity'
import {
  createOptimisticProductId,
  estimateNextProductKey,
} from '@/lib/optimisticProduct'
import {
  createProduct,
  distinctBrandsFromProducts,
  distinctCategoriesFromProducts,
  listProducts,
} from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'
import { ImagePlus, Plus } from 'lucide-react'

type AddProductDialogProps = {
  products: Product[]
  onOptimisticCreate: (product: Product) => void
  onCreateConfirmed: (tempId: string, product: Product) => void
  onCreateFailed: (tempId: string) => void
  onSuccess?: (detail: AdminSuccessDetail) => void
}

export function AddProductDialog({
  products,
  onOptimisticCreate,
  onCreateConfirmed,
  onCreateFailed,
  onSuccess,
}: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const inFlightRef = useRef(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [quantity, setQuantity] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [brandOptions, setBrandOptions] = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !supabaseConfigured) return
    void listProducts()
      .then((rows) => {
        setCategoryOptions(distinctCategoriesFromProducts(rows))
        setBrandOptions(distinctBrandsFromProducts(rows))
      })
      .catch(() => {
        setCategoryOptions([])
        setBrandOptions([])
      })
  }, [open])

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function resetForm() {
    setName('')
    setCategory('')
    setBrand('')
    setQuantity('')
    setImage(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function onImageChosen(file: File | null) {
    setImage(file)
  }

  async function fillDummyForm() {
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured.')
      return
    }
    try {
      const { category, name } = await nextDummyProductFields()
      setCategory(category)
      setName(name)
      setQuantity('99')
      onImageChosen(await loadDummyProductImage())
    } catch {
      toast.error('Could not load dummy data.')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (inFlightRef.current) return
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured.')
      return
    }
    if (!image) {
      toast.error('Please choose a product image.')
      return
    }
    const qty = parseOptionalCartonQuantity(quantity)
    if (!name.trim() || !category.trim() || qty === null) {
      toast.error('Fill in all fields with valid values.')
      return
    }

    const imageFile = image
    const optimisticPreview = URL.createObjectURL(imageFile)
    const tempId = createOptimisticProductId()
    const optimistic: Product = {
      id: tempId,
      product_key: estimateNextProductKey(products),
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      quantity_in_carton: qty,
      image_path: optimisticPreview,
      hidden: false,
      created_at: new Date().toISOString(),
    }

    inFlightRef.current = true
    onOptimisticCreate(optimistic)
    resetForm()
    setOpen(false)

    void createProduct({
      name,
      category,
      brand,
      quantityInCarton: qty,
      image: imageFile,
    })
      .then((created) => {
        onCreateConfirmed(tempId, created)
        onSuccess?.({ action: 'added', productKey: created.product_key })
        URL.revokeObjectURL(optimisticPreview)
      })
      .catch((err) => {
        onCreateFailed(tempId)
        URL.revokeObjectURL(optimisticPreview)
        toast.error(formatLoadError(err, 'Could not add product.'))
      })
      .finally(() => {
        inFlightRef.current = false
      })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={!supabaseConfigured}
        className={buttonVariants({
          size: 'lg',
          className: 'h-10 px-4 text-sm',
        })}
        render={<button type="button" />}
      >
        <Plus className="size-5" />
        Add product
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <CategoryCombobox
              id="product-category"
              value={category}
              onChange={setCategory}
              categories={categoryOptions}
              required
            />
            <div className="grid gap-2">
              <Label htmlFor="product-name">completion</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <BrandCombobox
              id="product-brand"
              value={brand}
              onChange={setBrand}
              brands={brandOptions}
            />
            <div className="grid gap-2">
              <Label htmlFor="product-qty">Quantity inside carton</Label>
              <Input
                id="product-qty"
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-image">Image</Label>
              <input
                ref={imageInputRef}
                id="product-image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onImageChosen(e.target.files?.[0] ?? null)}
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
                    <ProductImageWithWatermark
                      src={previewUrl}
                      alt="Selected product"
                      className="object-cover"
                    />
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
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={() => void fillDummyForm()}>
              Dummy
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="destructive" onClick={resetForm}>
                Reset
              </Button>
              <Button type="submit">Save product</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
