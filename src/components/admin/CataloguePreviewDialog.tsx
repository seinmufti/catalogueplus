import { useState } from 'react'
import { CustomerPhoneFrame } from '@/components/customer/CustomerPhoneFrame'
import { CustomerCataloguePage } from '@/pages/CustomerCataloguePage'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CataloguePreviewDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: 'secondary',
          size: 'lg',
          className:
            'h-10 border border-border bg-white px-4 text-sm text-foreground shadow-sm hover:bg-neutral-100 dark:bg-white dark:text-foreground dark:hover:bg-neutral-100',
        })}
        render={<button type="button" />}
      >
        Preview catalogue
      </DialogTrigger>
      <DialogContent
        className="max-w-[min(420px,calc(100%-2rem))] gap-3 border-0 bg-muted/60 p-4 shadow-none ring-0 sm:max-w-[420px]"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Customer catalogue preview</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <CustomerPhoneFrame>
            {open ? <CustomerCataloguePage /> : null}
          </CustomerPhoneFrame>
        </div>
      </DialogContent>
    </Dialog>
  )
}
