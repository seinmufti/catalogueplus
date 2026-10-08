import { CustomerProductCard } from '@/components/customer/CustomerProductCard'
import type { ProductCategoryGroup } from '@/lib/groupProductsByCategory'
import { cn } from '@/lib/utils'

type CustomerCategorySectionProps = {
  group: ProductCategoryGroup
  /** One catalogue section only — no chrome, grid may fill viewport. */
  standalone?: boolean
  fillViewport?: boolean
}

export function CustomerCategorySection({
  group,
  standalone = false,
  fillViewport = false,
}: CustomerCategorySectionProps) {
  const count = group.products.length

  return (
    <section
      className={cn(
        'min-h-0',
        standalone
          ? fillViewport
            ? 'flex flex-1 flex-col overflow-hidden'
            : undefined
          : 'overflow-hidden rounded-xl border border-border/70 bg-card/80 p-2 shadow-sm',
        !standalone && 'ring-1 ring-foreground/5',
      )}
    >
      {!standalone && (
        <header className="mb-2 flex items-center gap-2 border-b border-border/60 pb-2">
          <span className="h-4 w-0.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-foreground">
            {group.category}
          </h2>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        </header>
      )}

      <div
        className={cn(
          'grid grid-cols-2 gap-2',
          fillViewport && 'customer-product-grid-fit h-full min-h-0 flex-1',
        )}
      >
        {group.products.map((product) => (
          <CustomerProductCard
            key={product.id}
            product={product}
            showCategoryInTitle={standalone}
            fillCell={fillViewport}
          />
        ))}
      </div>
    </section>
  )
}
