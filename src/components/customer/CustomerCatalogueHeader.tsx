import type { MouseEvent } from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { STORE_DISPLAY_NAME } from '@/lib/store'
import { cn } from '@/lib/utils'

type CustomerCatalogueHeaderProps = {
  onScrollToTop?: () => void
}

/** Shared customer catalogue top bar (admin preview + live customer route). */
export function CustomerCatalogueHeader({ onScrollToTop }: CustomerCatalogueHeaderProps) {
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!onScrollToTop) return
    if (event.target instanceof Element && event.target.closest('a, button')) return
    onScrollToTop()
  }

  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-center gap-4 border-b bg-background px-3 py-3.5',
        onScrollToTop && 'cursor-pointer select-none active:opacity-80',
      )}
      onClick={onScrollToTop ? handleClick : undefined}
      title={onScrollToTop ? 'Scroll to top' : undefined}
    >
      <StoreLogo className="h-[4.25rem] w-auto shrink-0 pointer-events-none" />
      <h1 className="pointer-events-none text-start text-2xl font-semibold tracking-tight">
        {STORE_DISPLAY_NAME}
      </h1>
    </header>
  )
}
