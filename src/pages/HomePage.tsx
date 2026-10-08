import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { STORE_DISPLAY_NAME, cataloguePath } from '@/lib/store'
import { cn } from '@/lib/utils'

export function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Catalogue+</h1>
        <p className="mt-2 text-muted-foreground">Product catalogue for {STORE_DISPLAY_NAME}</p>
      </div>
      <Link
        to={cataloguePath()}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'h-12 min-w-[min(100%,18rem)] px-8 text-base font-semibold',
        )}
      >
        Customer catalogue
      </Link>
    </div>
  )
}
