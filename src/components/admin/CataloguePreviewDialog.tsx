import { useState } from 'react'
import { CustomerCatalogueInPhone } from '@/components/customer/CustomerCatalogueInPhone'
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
        className="fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-none cursor-default translate-none items-center justify-center gap-0 overflow-hidden border-0 bg-transparent p-4 shadow-none ring-0 sm:max-w-none [&_[data-slot=dialog-close]]:fixed [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:z-[60] [&_[data-slot=dialog-close]]:bg-background/90"
        showCloseButton
        onClick={() => setOpen(false)}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Customer catalogue preview on iPhone 17</DialogTitle>
        </DialogHeader>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <CustomerCatalogueInPhone active={open} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
