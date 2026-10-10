import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AdminPasswordGate } from '@/components/admin/AdminPasswordGate'
import { AdminPcOnlyGate } from '@/components/admin/AdminPcOnlyGate'
import { StoreCatalogueRoute } from '@/components/routing/StoreCatalogueRoute'
import { getRouterBasename } from '@/lib/router-basename'
import { adminPath, cataloguePath, isKnownStoreSlug } from '@/lib/store'
import { AdminPage } from '@/pages/AdminPage'
import { HomePage } from '@/pages/HomePage'

function StoreAdminRoute() {
  const { storeSlug } = useParams()
  if (!isKnownStoreSlug(storeSlug)) {
    return <Navigate to="/" replace />
  }
  return (
    <AdminPcOnlyGate>
      <AdminPasswordGate>
        <AdminPage />
      </AdminPasswordGate>
    </AdminPcOnlyGate>
  )
}

function LegacyCataloguePlusRedirect() {
  const { storeSlug } = useParams()
  if (isKnownStoreSlug(storeSlug)) {
    return <Navigate to={cataloguePath(storeSlug)} replace />
  }
  return <Navigate to="/" replace />
}

export default function App() {
  const basename = getRouterBasename()

  return (
    <BrowserRouter basename={basename}>
      <div className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<Navigate to={adminPath()} replace />} />
          <Route path="/catalogueplus/:storeSlug" element={<LegacyCataloguePlusRedirect />} />
          <Route path="/:storeSlug/admin" element={<StoreAdminRoute />} />
          <Route path="/:storeSlug" element={<StoreCatalogueRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toaster
        richColors
        position="bottom-center"
        closeButton
        offset="max(12px, env(safe-area-inset-bottom, 0px))"
      />
    </BrowserRouter>
  )
}
