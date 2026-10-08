import { useCallback, useEffect, useState } from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { ProductRevealCheckbox } from '@/components/admin/ProductRevealCheckbox'
import { CataloguePreviewDialog } from '@/components/admin/CataloguePreviewDialog'
import { DownloadBackupButton } from '@/components/admin/DownloadBackupButton'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatabaseSetupNotice } from '@/components/DatabaseSetupNotice'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { getPublicImageUrl, listProducts } from '@/lib/products'
import { supabaseConfigured } from '@/lib/supabase'
import type { Product } from '@/types/product'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

export function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbNotReady, setDbNotReady] = useState(false)

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setDbNotReady(false)
    try {
      setProducts(await listProducts())
    } catch (err) {
      if (isProductsTableMissingError(err)) {
        setProducts([])
        setDbNotReady(true)
      } else {
        setError(formatLoadError(err, 'Failed to load products.'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function handleRevealedChange(productId: string, revealed: boolean) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, revealed } : p)),
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StoreLogo className="h-16 w-auto shrink-0" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Catalogue+ Admin</h1>
              <p className="text-sm text-muted-foreground">Manage products for Aksesuarat Ali</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DownloadBackupButton />
            <CataloguePreviewDialog />
            <AddProductDialog onCreated={() => void load()} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {!supabaseConfigured && <SupabaseConfigNotice />}

        {dbNotReady && <DatabaseSetupNotice />}

        {error && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {loading && supabaseConfigured && (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        )}

        {!loading && supabaseConfigured && products.length === 0 && !error && !dbNotReady && (
          <p className="text-sm text-muted-foreground">No items have been added yet.</p>
        )}

        {products.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[88px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty / carton</TableHead>
                  <TableHead className="w-[72px] text-center [&:has([role=checkbox])]:pr-2">
                    <span className="block w-full text-center">Reveal</span>
                  </TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const imageUrl = getPublicImageUrl(product.image_path)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="size-14 rounded-md border object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.quantity_in_carton}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <ProductRevealCheckbox
                            productId={product.id}
                            revealed={product.revealed ?? true}
                            onRevealedChange={handleRevealedChange}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(product.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  )
}
