import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { StoreLogo } from '@/components/StoreLogo'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { AdminCategoryHeaderRow } from '@/components/admin/AdminCategoryHeaderRow'
import { AdminChangePasswordDialog } from '@/components/admin/AdminChangePasswordDialog'
import { AdminProductRow } from '@/components/admin/AdminProductRow'
import { AdminProductsTableSkeleton } from '@/components/admin/AdminProductsTableSkeleton'
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton'
import { CataloguePreviewDialog } from '@/components/admin/CataloguePreviewDialog'
import { DeleteSelectedProductsButton } from '@/components/admin/DeleteSelectedProductsButton'
import { DownloadBackupButton } from '@/components/admin/DownloadBackupButton'
import {
  CHECKBOX_COLUMN_CLASS,
  COPY_COLUMN_CLASS,
  ROW_SELECT_CHECKBOX_CLASS,
} from '@/components/admin/adminTableClasses'
import { DatabaseSetupNotice } from '@/components/DatabaseSetupNotice'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminCatalogue } from '@/hooks/useAdminCatalogue'
import { useCategoryDrag } from '@/hooks/useCategoryDrag'
import { moveItemInList, saveCategoryOrder } from '@/lib/categoryOrder'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function AdminPage() {
  const {
    products,
    loading,
    error,
    dbNotReady,
    selectedIds,
    selectedProducts,
    selectedCount,
    allRowsSelected,
    someRowsSelected,
    mergedCategoryOrder,
    categoryGroups,
    setCategoryOrder,
    mutations,
    notifySuccess,
    handleHiddenChange,
    setRowSelected,
    setAllRowsSelected,
  } = useAdminCatalogue()

  const commitCategoryOrder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const client = supabase
      if (!client) return
      const next = moveItemInList(mergedCategoryOrder, fromIndex, toIndex)
      const unchanged =
        next.length === mergedCategoryOrder.length &&
        next.every((label, i) => label === mergedCategoryOrder[i])
      if (unchanged) return
      setCategoryOrder(next)
      void saveCategoryOrder(client, next).catch(() => {
        toast.error('Could not save category order. Try again.')
      })
    },
    [mergedCategoryOrder, setCategoryOrder],
  )

  const { draggingCategory, tableContainerRef, handleGripPointerDown, handleGripMouseDown } =
    useCategoryDrag(commitCategoryOrder)

  const hasTable = !loading && products.length > 0
  useEffect(() => {
    const container = tableContainerRef.current
    if (!container || !hasTable) return
    const observer = new ResizeObserver(() => {
      container.style.setProperty('--admin-table-visible-width', `${container.clientWidth}px`)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [hasTable, tableContainerRef])

  const collapseProductRows = draggingCategory !== null
  const showGroupHeaders = categoryGroups.length > 1
  const rowNumbers = useMemo(() => {
    const numbers = new Map<string, number>()
    for (const group of categoryGroups) {
      for (const product of group.products) numbers.set(product.id, numbers.size + 1)
    }
    return numbers
  }, [categoryGroups])

  return (
    <div className="min-h-svh w-full bg-background">
      <header className="border-b px-6 py-4 lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-wrap items-center gap-2 lg:justify-self-start">
            <DeleteSelectedProductsButton
              products={selectedProducts}
              disabled={selectedCount === 0}
              onSuccess={notifySuccess}
              onOptimisticDeleteMany={mutations.removeManyOptimistic}
              onRestoreProduct={mutations.restoreProduct}
            />
            <DownloadBackupButton />
            <AdminChangePasswordDialog />
            <AdminSignOutButton />
          </div>
          <div className="flex items-center justify-center gap-4 lg:justify-self-center">
            <StoreLogo className="h-16 w-auto shrink-0" />
            <h1 className="text-2xl font-semibold tracking-tight">Catalogue+ Admin</h1>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-self-end lg:justify-end">
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

        {loading && supabaseConfigured && <AdminProductsTableSkeleton />}

        {!loading && supabaseConfigured && products.length === 0 && !error && !dbNotReady && (
          <p className="text-sm text-muted-foreground">No items have been added yet.</p>
        )}

        {hasTable && (
          <div
            ref={tableContainerRef}
            className={cn(
              'relative w-full rounded-lg border',
              draggingCategory !== null
                ? 'category-reorder-active overflow-x-hidden'
                : 'overflow-x-auto',
            )}
          >
            <div>
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
                    <TableHead className={COPY_COLUMN_CLASS}>
                      <span className="block w-full py-2 text-center text-sm">Copy</span>
                    </TableHead>
                    <TableHead className="w-[88px] text-center">Edit</TableHead>
                    <TableHead className="w-[96px] text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={cn(draggingCategory !== null && 'category-reorder-dragging')}>
                  {categoryGroups.flatMap((group) => {
                    const productRows = group.products.map((product) => {
                      return (
                        <AdminProductRow
                          key={product.id}
                          product={product}
                          rowIndex={rowNumbers.get(product.id) ?? 0}
                          selected={selectedIds.has(product.id)}
                          collapsed={collapseProductRows}
                          mutations={mutations}
                          onSelectedChange={setRowSelected}
                          onHiddenChange={handleHiddenChange}
                          onSuccess={notifySuccess}
                        />
                      )
                    })

                    if (!showGroupHeaders) return productRows
                    return [
                      <AdminCategoryHeaderRow
                        key={`cat-${group.category}`}
                        category={group.category}
                        productCount={group.products.length}
                        isDragging={draggingCategory === group.category}
                        onGripPointerDown={handleGripPointerDown}
                        onGripMouseDown={handleGripMouseDown}
                      />,
                      ...productRows,
                    ]
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
