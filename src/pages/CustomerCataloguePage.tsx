import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { getPublicImageUrl, listCatalogueProducts } from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import type { Product } from '@/types/product'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 9

export function CustomerCataloguePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

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

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE))

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1))
  }, [page, pageCount])

  const pageProducts = useMemo(() => {
    const start = page * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [page, products])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-center gap-2 border-b px-3 py-2">
        <StoreLogo className="h-12 w-auto shrink-0" />
        <h1 className="text-sm font-semibold tracking-tight">Aksesuarat Ali</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-2 py-2">
        {!supabaseConfigured && (
          <div className="p-2">
            <SupabaseConfigNotice />
          </div>
        )}

        {error && (
          <p className="px-1 py-2 text-center text-xs text-destructive" role="alert">
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

        {!loading && pageProducts.length > 0 && (
          <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-1.5">
            {pageProducts.map((product) => {
              const imageUrl = getPublicImageUrl(product.image_path)
              return (
                <Card key={product.id} className="min-h-0 gap-0 py-0 shadow-none">
                  <CardContent className="flex h-full flex-col p-1.5">
                    <div className="relative mb-1 aspect-square w-full overflow-hidden rounded-md bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-tight font-medium">
                      {product.name}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground">{product.category}</p>
                    <p className="mt-auto text-[9px] tabular-nums text-muted-foreground">
                      {product.quantity_in_carton} / carton
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {products.length > PAGE_SIZE && (
          <div className="mt-2 flex shrink-0 items-center justify-between gap-2 border-t pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
