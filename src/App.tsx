import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AdminPcOnlyGate } from '@/components/admin/AdminPcOnlyGate'
import { CustomerViewport } from '@/components/customer/CustomerViewport'
import { AdminPage } from '@/pages/AdminPage'
import { CustomerCataloguePage } from '@/pages/CustomerCataloguePage'
import { HomePage } from '@/pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin"
          element={
            <AdminPcOnlyGate>
              <AdminPage />
            </AdminPcOnlyGate>
          }
        />
        <Route
          path="/catalogueplus/aksesuaratali"
          element={
            <CustomerViewport>
              <CustomerCataloguePage />
            </CustomerViewport>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  )
}
