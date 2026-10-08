import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CustomerPhoneFrameProps = {
  children: ReactNode
  className?: string
}

export function CustomerPhoneFrame({ children, className }: CustomerPhoneFrameProps) {
  return (
    <div
      className={cn(
        'flex w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden',
        'aspect-[390/844] max-h-[min(844px,calc(100svh-4rem))]',
        'rounded-xl border border-border bg-background shadow-lg',
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
