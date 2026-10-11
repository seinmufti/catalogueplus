import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { copyImageUrlToClipboard } from '@/lib/copyImageToClipboard'
import { cn } from '@/lib/utils'
import { Clipboard } from 'lucide-react'

type CopyProductImageButtonProps = {
  imageUrl: string | null
  watermarkedImageUrl?: string | null
  productLabel: string
  className?: string
}

export function CopyProductImageButton({
  imageUrl,
  watermarkedImageUrl,
  productLabel,
  className,
}: CopyProductImageButtonProps) {
  const [copying, setCopying] = useState(false)

  async function handleCopy() {
    if (!imageUrl || copying) return
    setCopying(true)
    try {
      await copyImageUrlToClipboard(imageUrl, watermarkedImageUrl)
      toast.success('Image copied to clipboard.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not copy image.'
      toast.error(message)
    } finally {
      setCopying(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={!imageUrl || copying}
      aria-label={`Copy image for ${productLabel}`}
      title="Copy image to clipboard"
      onClick={() => void handleCopy()}
      className={cn(
        'absolute inset-0 h-full min-h-14 w-full rounded-none border-0 shadow-none hover:bg-muted/60',
        className,
      )}
    >
      <Clipboard className="size-5" />
    </Button>
  )
}
