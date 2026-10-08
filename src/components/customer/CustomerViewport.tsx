import type { ReactNode } from 'react'
import { CustomerPhoneFrame } from '@/components/customer/CustomerPhoneFrame'
import { useIsMobileViewport } from '@/hooks/useMediaQuery'

type CustomerViewportProps = {
  children: ReactNode
}

export function CustomerViewport({ children }: CustomerViewportProps) {
  const isMobile = useIsMobileViewport()

  if (isMobile) {
    return (
      <div className="customer-mobile-shell bg-background">{children}</div>
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden bg-muted/60 p-4">
      <CustomerPhoneFrame variant="iphone" fitWithinViewport>
        {children}
      </CustomerPhoneFrame>
    </div>
  )
}
