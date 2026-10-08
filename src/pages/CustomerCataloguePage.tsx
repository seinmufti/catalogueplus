import { useCallback, useEffect, useMemo, useState } from 'react'
import { CustomerCatalogueHeader } from '@/components/customer/CustomerCatalogueHeader'
import { CustomerCategorySection } from '@/components/customer/CustomerCategorySection'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { DUMMY_PRODUCT_COUNT } from '@/lib/dummyProduct'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { groupProductsByCategory } from '@/lib/groupProductsByCategory'
import { listCatalogueProducts } from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

export function CustomerCataloguePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setProducts(await listCatalogueProducts())
    } catch (err) {
      if (isProductsTableMissingError(err)) {
        setProducts([])
      } else {
        setError(formatLoadError(err, 'Failed to load catalogue.'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const categoryGroups = useMemo(() => groupProductsByCategory(products), [products])
  const multiSection = categoryGroups.length > 1
  const fitsOneScreen =
    !multiSection && products.length > 0 && products.length <= DUMMY_PRODUCT_COUNT

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <CustomerCatalogueHeader />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 pt-1 pb-1.5">
        {!supabaseConfigured && (
          <div className="shrink-0 p-1">
            <SupabaseConfigNotice />
          </div>
        )}

        {error && (
          <p className="shrink-0 px-1 py-1 text-center text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        {loading && supabaseConfigured && (
          <p className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Loading…
          </p>
        )}

        {!loading && supabaseConfigured && products.length === 0 && !error && (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No items have been added yet.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div
            className={cn(
              'min-h-0 flex-1',
              fitsOneScreen
                ? 'flex flex-col overflow-hidden'
                : cn(
                    'overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
                    multiSection ? 'space-y-2.5 py-0.5' : 'py-0.5',
                  ),
            )}
          >
            {categoryGroups.map((group) => (
              <CustomerCategorySection
                key={group.category}
                group={group}
                standalone={!multiSection}
                fillViewport={fitsOneScreen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
