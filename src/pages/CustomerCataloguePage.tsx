import { useCallback, useEffect, useState } from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { Card, CardContent } from '@/components/ui/card'
import { DUMMY_PRODUCT_COUNT } from '@/lib/dummyProduct'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { productDisplayTitle } from '@/lib/productDisplayTitle'
import { getPublicImageUrl, listCatalogueProducts } from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

const GRID_ROWS = DUMMY_PRODUCT_COUNT / 2

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

  const rowCount = Math.ceil(products.length / 2)
  const fitsOneScreen = products.length > 0 && products.length <= DUMMY_PRODUCT_COUNT

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-center gap-3 border-b bg-background px-3 py-2.5">
        <StoreLogo className="h-11 w-auto shrink-0" />
        <h1 className="text-base font-semibold tracking-tight">Aksesuarat Ali</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-1 pb-1">
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
                ? 'overflow-hidden'
                : 'overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            )}
          >
            <div
              className={cn(
                'grid h-full grid-cols-2 gap-1.5',
                fitsOneScreen && 'customer-product-grid-fit',
              )}
              style={
                fitsOneScreen
                  ? undefined
                  : {
                      gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
                      minHeight: `${(rowCount / GRID_ROWS) * 100}%`,
                    }
              }
            >
              {products.map((product) => {
                const imageUrl = getPublicImageUrl(product.image_path)
                const displayName = productDisplayTitle(product.category, product.name)
                return (
                  <Card
                    key={product.id}
                    className="flex h-full min-h-0 flex-col gap-0 py-0 shadow-none"
                  >
                    <CardContent className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-1 p-1.5">
                      <div className="flex min-h-0 items-center justify-center overflow-hidden">
                        <div className="aspect-[5/4] w-[76%] max-w-full overflow-hidden rounded-md bg-muted">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={displayName}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 pb-0.5">
                        <p className="line-clamp-2 text-sm leading-snug font-medium">
                          {displayName}
                        </p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {product.quantity_in_carton} / carton
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
