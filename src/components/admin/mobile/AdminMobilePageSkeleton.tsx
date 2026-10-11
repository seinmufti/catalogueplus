import { Skeleton } from '@/components/ui/skeleton'

export function AdminMobilePageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}
