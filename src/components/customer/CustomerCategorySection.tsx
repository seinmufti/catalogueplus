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
          : 'overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-sm',
        !standalone && 'ring-1 ring-foreground/5',
      )}
    >
      {!standalone && (
        <header className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-950 px-3 py-2.5 dark:from-purple-500 dark:to-purple-950">
          <h2 className="min-w-0 flex-1 truncate text-start text-lg font-semibold leading-snug text-white">
            {group.category}
          </h2>
          <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium tabular-nums text-white">
            {count}
          </span>
        </header>
      )}

      <div
        className={cn(
          'grid grid-cols-2 gap-2 p-2',
          fillViewport && 'customer-product-grid-fit min-h-0 flex-1',
          fillViewport && standalone && 'h-full',
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
