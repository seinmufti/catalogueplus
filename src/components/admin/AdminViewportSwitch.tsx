import { useIsMobileViewport } from '@/hooks/useMediaQuery'
import { AdminMobilePage } from '@/pages/AdminMobilePage'
import { AdminPage } from '@/pages/AdminPage'

/** Renders mobile or desktop admin without loading both UIs. */
export function AdminViewportSwitch() {
  const isMobile = useIsMobileViewport()
  return isMobile ? <AdminMobilePage /> : <AdminPage />
}
