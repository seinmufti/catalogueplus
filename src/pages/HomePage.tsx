import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Catalogue+</h1>
        <p className="mt-2 text-muted-foreground">Product catalogue for Aksesuarat Ali</p>
      </div>
      <Link to="/catalogueplus/aksesuaratali" className={buttonVariants()}>
        Customer catalogue
      </Link>
    </div>
  )
}
