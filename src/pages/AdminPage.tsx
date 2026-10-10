import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { AdminProductImagePreview } from '@/components/admin/AdminProductImagePreview'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { EditProductDialog } from '@/components/admin/EditProductDialog'
import { ProductHideCheckbox } from '@/components/admin/ProductHideCheckbox'
import { CataloguePreviewDialog } from '@/components/admin/CataloguePreviewDialog'
import { showAdminSuccessToast } from '@/components/admin/adminSuccessToast'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { DeleteSelectedProductsButton } from '@/components/admin/DeleteSelectedProductsButton'
import { AdminChangePasswordDialog } from '@/components/admin/AdminChangePasswordDialog'
import { CopyProductImageButton } from '@/components/admin/CopyProductImageButton'
import { DownloadBackupButton } from '@/components/admin/DownloadBackupButton'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatabaseSetupNotice } from '@/components/DatabaseSetupNotice'
import { useAdminProductMutations } from '@/hooks/useAdminProductMutations'
import { initAdminPassword } from '@/lib/adminAuth'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { groupProductsByCategory } from '@/lib/groupProductsByCategory'
import { productAdminFullName } from '@/lib/productDisplayTitle'
import { getPublicImageUrl, listProducts } from '@/lib/products'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { Product } from '@/types/product'

const ROW_SELECT_CHECKBOX_CLASS =
  'size-6 border-neutral-600 dark:border-neutral-400 data-checked:border-primary [&_[data-slot=checkbox-indicator]_svg]:size-4'

/** Shared width for Select + Hide checkbox columns. */
const CHECKBOX_COLUMN_CLASS =
  'relative w-[4.5rem] min-w-[4.5rem] p-0 text-center align-middle [&:has([role=checkbox])]:p-0'

const CHECKBOX_CELL_LABEL_CLASS =
  'flex h-full min-h-14 w-full cursor-pointer items-center justify-center'

export function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbNotReady, setDbNotReady] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const notifySuccess = useCallback((detail: AdminSuccessDetail) => {
    showAdminSuccessToast(detail)
  }, [])

  const mutations = useAdminProductMutations(setProducts, setSelectedIds)

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

  useEffect(() => {
    void initAdminPassword(supabase)
  }, [])

  function handleHiddenChange(productId: string, hidden: boolean) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, hidden } : p)),
    )
  }

  function setRowSelected(productId: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(productId)
      else next.delete(productId)
      return next
    })
  }

  function setAllRowsSelected(selected: boolean) {
    if (selected) {
      setSelectedIds(new Set(products.map((p) => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const categoryGroups = useMemo(() => groupProductsByCategory(products), [products])

  const selectedProducts = products.filter((p) => selectedIds.has(p.id))
  const selectedCount = selectedProducts.length
  const allRowsSelected = products.length > 0 && selectedCount === products.length
  const someRowsSelected = selectedCount > 0 && !allRowsSelected

  return (
    <div className="min-h-svh w-full bg-background">
      <header className="border-b px-6 py-4 lg:px-8">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StoreLogo className="h-16 w-auto shrink-0" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Catalogue+ Admin</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DeleteSelectedProductsButton
              products={selectedProducts}
              disabled={selectedCount === 0}
              onSuccess={notifySuccess}
              onOptimisticDeleteMany={mutations.removeManyOptimistic}
              onRestoreProduct={mutations.restoreProduct}
            />
            <DownloadBackupButton />
            <AdminChangePasswordDialog />
            <CataloguePreviewDialog />
            <AddProductDialog
              products={products}
              onOptimisticCreate={mutations.addOptimistic}
              onCreateConfirmed={mutations.confirmCreated}
              onCreateFailed={mutations.revertCreated}
              onSuccess={notifySuccess}
            />
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6 lg:px-8">
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
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table className="w-full [&_td:not(:last-child)]:border-r [&_th:not(:last-child)]:border-r [&_td]:border-border [&_th]:border-border">
              <TableHeader>
                <TableRow>
                  <TableHead className={CHECKBOX_COLUMN_CLASS}>
                    <label className="flex h-10 w-full cursor-pointer items-center justify-center">
                      <Checkbox
                        aria-label="Select all"
                        checked={allRowsSelected}
                        indeterminate={someRowsSelected}
                        className={ROW_SELECT_CHECKBOX_CLASS}
                        onCheckedChange={(checked) => setAllRowsSelected(Boolean(checked))}
                      />
                    </label>
                  </TableHead>
                  <TableHead className="w-12 text-center">Index</TableHead>
                  <TableHead className="min-w-[7rem]">ID</TableHead>
                  <TableHead className="w-[72px]">Image</TableHead>
                  <TableHead className="w-[18%]">Category</TableHead>
                  <TableHead className="w-[22%]">completion</TableHead>
                  <TableHead className="w-[11%]">Brand</TableHead>
                  <TableHead className="w-[27%]">Name</TableHead>
                  <TableHead>Qty / carton</TableHead>
                  <TableHead className={CHECKBOX_COLUMN_CLASS}>
                    <span className="block w-full text-center text-sm">Hide</span>
                  </TableHead>
                  <TableHead className="w-12 text-center">Copy</TableHead>
                  <TableHead className="w-[88px] text-center">Edit</TableHead>
                  <TableHead className="w-[96px] text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let rowIndex = 0
                  return categoryGroups.flatMap((group) => {
                    const showGroupHeaders = categoryGroups.length > 1
                    const headerRow = showGroupHeaders ? (
                      <TableRow
                        key={`cat-${group.category}`}
                        className="border-t-2 border-t-border bg-muted/30 hover:bg-muted/30"
                      >
                        <TableCell
                          colSpan={13}
                          className="bg-gradient-to-r from-purple-600 to-purple-950 p-0 dark:from-purple-500 dark:to-purple-950"
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <span
                              dir="rtl"
                              lang="ar"
                              className="min-w-0 flex-1 text-start text-lg font-semibold leading-snug text-white"
                            >
                              {group.category}
                            </span>
                            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums text-white">
                              {group.products.length}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null

                    const productRows = group.products.map((product) => {
                      rowIndex += 1
                      const imageUrl = getPublicImageUrl(product.image_path)
                      const selected = selectedIds.has(product.id)
                      return (
                        <TableRow key={product.id} data-state={selected ? 'selected' : undefined}>
                          <TableCell className={CHECKBOX_COLUMN_CLASS}>
                            <label className={CHECKBOX_CELL_LABEL_CLASS}>
                              <Checkbox
                                aria-label={`Select ${product.name}`}
                                checked={selected}
                                className={ROW_SELECT_CHECKBOX_CLASS}
                                onCheckedChange={(checked) =>
                                  setRowSelected(product.id, Boolean(checked))
                                }
                              />
                            </label>
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                            {rowIndex}
                          </TableCell>
                          <TableCell className="font-mono text-sm tabular-nums">
                            {product.product_key}
                          </TableCell>
                          <TableCell>
                            {imageUrl ? (
                              <AdminProductImagePreview
                                imageUrl={imageUrl}
                                productCategory={product.category}
                                productName={product.name}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {product.category.trim() || '—'}
                          </TableCell>
                          <TableCell className="whitespace-normal">{product.name}</TableCell>
                          <TableCell className="whitespace-normal">{product.brand || '—'}</TableCell>
                          <TableCell className="font-medium whitespace-normal">
                            {productAdminFullName(
                              product.category,
                              product.name,
                              product.brand,
                            ) || '—'}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {product.quantity_in_carton > 0 ? product.quantity_in_carton : '—'}
                          </TableCell>
                          <TableCell className={CHECKBOX_COLUMN_CLASS}>
                            <ProductHideCheckbox
                              productId={product.id}
                              productKey={product.product_key}
                              hidden={product.hidden}
                              onHiddenChange={handleHiddenChange}
                              onSuccess={notifySuccess}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <CopyProductImageButton
                                imageUrl={imageUrl}
                                productLabel={product.product_key}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <EditProductDialog
                                product={product}
                                onOptimisticUpdate={mutations.patchOptimistic}
                                onUpdateConfirmed={mutations.confirmUpdated}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DeleteProductButton
                                product={product}
                                onOptimisticDelete={mutations.removeOptimistic}
                                onSuccess={notifySuccess}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })

                    return headerRow ? [headerRow, ...productRows] : productRows
                  })
                })()}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  )
}
