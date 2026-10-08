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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nextDummyProductFields } from '@/lib/dummyProduct'
import { createProduct } from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ImagePlus, Plus } from 'lucide-react'

type AddProductDialogProps = {
  onCreated: () => void
}

const DUMMY_PRODUCT_IMAGE_URL = '/dummy-product.jpg'

async function loadDummyProductImage(): Promise<File> {
  const res = await fetch(DUMMY_PRODUCT_IMAGE_URL)
  if (!res.ok) throw new Error('Could not load dummy image.')
  const blob = await res.blob()
  return new File([blob], 'dummy-product.jpg', { type: blob.type || 'image/jpeg' })
}

export function AddProductDialog({ onCreated }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<'upload' | 'save' | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured.')
      return
    }
    if (!image) {
      toast.error('Please choose a product image.')
      return
    }
    const qty = Number.parseInt(quantity, 10)
    if (!name.trim() || !category.trim() || Number.isNaN(qty) || qty < 0) {
      toast.error('Fill in all fields with valid values.')
      return
    }

    setSubmitting(true)
    setSubmitPhase('upload')
    try {
      await createProduct(
        {
          name,
          category,
          quantityInCarton: qty,
          image,
        },
        { onPhase: setSubmitPhase },
      )
      toast.success('Product added.')
      resetForm()
      setOpen(false)
      onCreated()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add product.'
      toast.error(message)
    } finally {
      setSubmitting(false)
      setSubmitPhase(null)
    }
  }

  const submitLabel = submitting
    ? submitPhase === 'save'
      ? 'Saving…'
      : 'Uploading image…'
    : 'Save product'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
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
            <div className="grid gap-2">
              <Label htmlFor="product-category">Category</Label>
              <Input
                id="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-qty">Quantity inside carton</Label>
              <Input
                id="product-qty"
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
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
                    <img
                      src={previewUrl}
                      alt="Selected product"
                      className="size-full object-cover"
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
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => void fillDummyForm()}
            >
              Dummy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
