import { CustomerCatalogueInPhone } from '@/components/customer/CustomerCatalogueInPhone'
import { CustomerCataloguePage } from '@/pages/CustomerCataloguePage'
import { useIsMobileViewport } from '@/hooks/useMediaQuery'

export function CustomerViewport() {
  const isMobile = useIsMobileViewport()

  if (isMobile) {
    return (
      <div className="customer-mobile-shell bg-background">
        <CustomerCataloguePage />
      </div>
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden bg-muted/60 p-4">
      <CustomerCatalogueInPhone />
    </div>
  )
}
