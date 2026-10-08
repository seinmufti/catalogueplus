import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { formatLoadError } from '@/lib/errors'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { setProductHidden } from '@/lib/products'

type ProductHideCheckboxProps = {
  productId: string
  productKey: string
  hidden: boolean
  onHiddenChange: (productId: string, hidden: boolean) => void
  onSuccess?: (detail: AdminSuccessDetail) => void
}

export function ProductHideCheckbox({
  productId,
  productKey,
  hidden,
  onHiddenChange,
  onSuccess,
}: ProductHideCheckboxProps) {
  async function handleChange(checked: boolean) {
    const nextHidden = Boolean(checked)
    if (nextHidden === hidden) return

    const previousHidden = hidden
    onHiddenChange(productId, nextHidden)

    try {
      await setProductHidden(productId, nextHidden)
      onSuccess?.({
        action: nextHidden ? 'hidden' : 'shown',
        productKey,
      })
    } catch (err) {
      onHiddenChange(productId, previousHidden)
      toast.error(formatLoadError(err, 'Could not update Hide.'))
    }
  }

  return (
    <div className="flex justify-center">
      <Checkbox
        aria-label="Hide from customer catalogue"
        checked={hidden}
        className="size-6 border-neutral-600 dark:border-neutral-400 data-checked:border-primary [&_[data-slot=checkbox-indicator]_svg]:size-4"
        onCheckedChange={(checked) => void handleChange(checked)}
      />
    </div>
  )
}
