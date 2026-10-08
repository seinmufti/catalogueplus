import { StoreLogo } from '@/components/StoreLogo'
import { STORE_DISPLAY_NAME } from '@/lib/store'

/** Shared customer catalogue top bar (admin preview + live customer route). */
export function CustomerCatalogueHeader() {
  return (
    <header className="flex shrink-0 items-center justify-center gap-4 border-b bg-background px-3 py-3.5">
      <StoreLogo className="h-[4.25rem] w-auto shrink-0" />
      <h1 className="text-2xl font-semibold tracking-tight">{STORE_DISPLAY_NAME}</h1>
    </header>
  )
}
