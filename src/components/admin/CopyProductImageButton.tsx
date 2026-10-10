import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { copyImageUrlToClipboard } from '@/lib/copyImageToClipboard'
import { Clipboard } from 'lucide-react'

type CopyProductImageButtonProps = {
  imageUrl: string | null
  productLabel: string
}

export function CopyProductImageButton({ imageUrl, productLabel }: CopyProductImageButtonProps) {
  const [copying, setCopying] = useState(false)

  async function handleCopy() {
    if (!imageUrl || copying) return
    setCopying(true)
    try {
      await copyImageUrlToClipboard(imageUrl)
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
      variant="outline"
      size="icon-sm"
      disabled={!imageUrl || copying}
      aria-label={`Copy image for ${productLabel}`}
      title="Copy image to clipboard"
      onClick={() => void handleCopy()}
    >
      <Clipboard className="size-3.5" />
    </Button>
  )
}
