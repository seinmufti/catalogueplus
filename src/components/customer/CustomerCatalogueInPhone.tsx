import { CustomerPhoneFrame } from '@/components/customer/CustomerPhoneFrame'
import { CustomerCataloguePage } from '@/pages/CustomerCataloguePage'

type CustomerCatalogueInPhoneProps = {
  /** When false, skip mounting the page (e.g. closed admin preview dialog). */
  active?: boolean
}

/** iPhone frame + catalogue page — one source for desktop customer URL and admin preview. */
export function CustomerCatalogueInPhone({ active = true }: CustomerCatalogueInPhoneProps) {
  return (
    <CustomerPhoneFrame variant="iphone" fitWithinViewport>
      {active ? <CustomerCataloguePage /> : null}
    </CustomerPhoneFrame>
  )
}
