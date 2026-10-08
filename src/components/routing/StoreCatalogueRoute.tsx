import { Navigate, useParams } from 'react-router-dom'
import { CustomerViewport } from '@/components/customer/CustomerViewport'
import { isKnownStoreSlug } from '@/lib/store'
export function StoreCatalogueRoute() {
  const { storeSlug } = useParams()
  if (!isKnownStoreSlug(storeSlug)) {
    return <Navigate to="/" replace />
  }
  return <CustomerViewport />
}
