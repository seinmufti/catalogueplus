import { useCallback, useEffect, useState } from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { EditProductDialog } from '@/components/admin/EditProductDialog'
import { ProductHideCheckbox } from '@/components/admin/ProductHideCheckbox'
import { CataloguePreviewDialog } from '@/components/admin/CataloguePreviewDialog'
import { showAdminSuccessToast } from '@/components/admin/adminSuccessToast'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
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

export function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbNotReady, setDbNotReady] = useState(false)
  const notifySuccess = useCallback((detail: AdminSuccessDetail) => {
    showAdminSuccessToast(detail)
  }, [])

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

  function handleHiddenChange(productId: string, hidden: boolean) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, hidden } : p)),
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
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
            <AddProductDialog
              onCreated={() => void load()}
              onSuccess={notifySuccess}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
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
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Index</TableHead>
                  <TableHead className="min-w-[8.5rem]">ID</TableHead>
                  <TableHead className="w-[72px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty / carton</TableHead>
                  <TableHead className="w-[72px] text-center [&:has([role=checkbox])]:pr-2">
                    <span className="block w-full text-center">Hide</span>
                  </TableHead>
                  <TableHead className="w-[88px] text-center">Edit</TableHead>
                  <TableHead className="w-[96px] text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => {
                  const rowIndex = index + 1
                  const imageUrl = getPublicImageUrl(product.image_path)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                        {rowIndex}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">{product.product_key}</TableCell>
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
                          <ProductHideCheckbox
                            productId={product.id}
                            productKey={product.product_key}
                            hidden={product.hidden}
                            onHiddenChange={handleHiddenChange}
                            onSuccess={notifySuccess}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <EditProductDialog
                            product={product}
                            onUpdated={() => void load()}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <DeleteProductButton
                            product={product}
                            onDeleted={() => void load()}
                            onSuccess={notifySuccess}
                          />
                        </div>
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
