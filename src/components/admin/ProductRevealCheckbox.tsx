import { useState } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { setProductRevealed } from '@/lib/products'

type ProductRevealCheckboxProps = {
  productId: string
  revealed: boolean
  onRevealedChange: (productId: string, revealed: boolean) => void
}

export function ProductRevealCheckbox({
  productId,
  revealed,
  onRevealedChange,
}: ProductRevealCheckboxProps) {
  const [saving, setSaving] = useState(false)

  async function handleChange(checked: boolean) {
    const next = Boolean(checked)
    setSaving(true)
    try {
      await setProductRevealed(productId, next)
      onRevealedChange(productId, next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update Reveal.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex justify-center">
      <Checkbox
        aria-label="Reveal on customer catalogue"
        checked={revealed}
        disabled={saving}
        onCheckedChange={(checked) => void handleChange(checked)}
      />
    </div>
  )
}
