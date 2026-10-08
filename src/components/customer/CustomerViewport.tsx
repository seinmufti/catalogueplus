import type { ReactNode } from 'react'
import { CustomerPhoneFrame } from '@/components/customer/CustomerPhoneFrame'
import { useIsMobileViewport } from '@/hooks/useMediaQuery'

type CustomerViewportProps = {
  children: ReactNode
}

export function CustomerViewport({ children }: CustomerViewportProps) {
  const isMobile = useIsMobileViewport()

  if (isMobile) {
    return <div className="min-h-dvh w-full bg-background">{children}</div>
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/60 p-6">
      <CustomerPhoneFrame className="max-h-[calc(100svh-3rem)]">{children}</CustomerPhoneFrame>
    </div>
  )
}
