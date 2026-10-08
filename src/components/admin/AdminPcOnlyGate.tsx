import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { useIsMobileViewport } from '@/hooks/useMediaQuery'
import { cataloguePath } from '@/lib/store'

type AdminPcOnlyGateProps = {
  children: ReactNode
}

export function AdminPcOnlyGate({ children }: AdminPcOnlyGateProps) {
  const isMobile = useIsMobileViewport()

  if (isMobile) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
        <p className="max-w-sm text-muted-foreground">
          Only available on PC. Open this page on a desktop or laptop to manage products.
        </p>
        <Link
          to={cataloguePath()}
          className={buttonVariants({ variant: 'outline' })}
        >
          View customer catalogue
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
