import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CustomerCatalogueFooter } from '@/components/customer/CustomerCatalogueFooter'
import { CustomerCatalogueHeader } from '@/components/customer/CustomerCatalogueHeader'
import { CustomerCatalogueSkeleton } from '@/components/customer/CustomerCatalogueSkeleton'
import { CustomerCategorySection } from '@/components/customer/CustomerCategorySection'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { DUMMY_PRODUCT_COUNT } from '@/lib/dummyProduct'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { groupProductsByCategory } from '@/lib/groupProductsByCategory'
import {
  mergeCategoryOrderWithLabels,
  readCategoryOrder,
} from '@/lib/categoryOrder'
import { listCatalogueProducts } from '@/lib/products'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

export function CustomerCataloguePage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [savedOrder, setSavedOrder] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    // Saved order is optional; fall back to alphabetical when it cannot be read.
    Promise.all([listCatalogueProducts(), readCategoryOrder(supabase).catch(() => null)])
      .then(([list, saved]) => {
        if (cancelled) return
        setSavedOrder(saved)
        setProducts(list)
      })
      .catch((err) => {
        if (cancelled || isProductsTableMissingError(err)) return
        setError(formatLoadError(err, 'Failed to load catalogue.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categoryOrder = useMemo(
    () => mergeCategoryOrderWithLabels(savedOrder, products.map((p) => p.category)),
    [savedOrder, products],
  )

  const categoryGroups = useMemo(
    () => groupProductsByCategory(products, categoryOrder),
    [products, categoryOrder],
  )
  const multiSection = categoryGroups.length > 1
  const fitsOneScreen =
    !multiSection && products.length > 0 && products.length <= DUMMY_PRODUCT_COUNT

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      <CustomerCatalogueHeader onScrollToTop={scrollToTop} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 pt-1 pb-1">
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

        {loading && supabaseConfigured && <CustomerCatalogueSkeleton scrollRef={scrollRef} />}

        {!loading && supabaseConfigured && products.length === 0 && !error && (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No items have been added yet.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div
            ref={scrollRef}
            className={cn(
              'min-h-0 flex-1',
              fitsOneScreen
                ? 'flex flex-col overflow-hidden'
                : cn(
                    'customer-catalogue-scroll overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
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

      <CustomerCatalogueFooter />
    </div>
  )
}
