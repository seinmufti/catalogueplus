import { Skeleton } from '@/components/ui/skeleton'

function CustomerProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 p-1.5">
      <div className="flex min-h-[4.5rem] items-center justify-center">
        <Skeleton className="aspect-[5/4] w-[76%] max-w-full rounded-md" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function CustomerCategorySectionSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-sm ring-1 ring-foreground/5">
      <Skeleton className="h-11 w-full rounded-none bg-purple-600/25" />
      <div className="grid grid-cols-2 gap-2 p-2">
        {Array.from({ length: cards }).map((_, i) => (
          <CustomerProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

export function CustomerCatalogueSkeleton() {
  return (
    <div
      className="customer-catalogue-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto py-0.5"
      aria-busy="true"
      aria-label="Loading catalogue"
    >
      <CustomerCategorySectionSkeleton cards={6} />
      <CustomerCategorySectionSkeleton cards={4} />
    </div>
  )
}
