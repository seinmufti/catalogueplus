import { StoreLogo } from '@/components/StoreLogo'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { AdminMobileMenuDialog } from '@/components/admin/mobile/AdminMobileMenuDialog'
import { AdminMobilePageSkeleton } from '@/components/admin/mobile/AdminMobilePageSkeleton'
import { AdminMobileProductCard } from '@/components/admin/mobile/AdminMobileProductCard'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { DatabaseSetupNotice } from '@/components/DatabaseSetupNotice'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdminCatalogue } from '@/hooks/useAdminCatalogue'
import { supabaseConfigured } from '@/lib/supabase'

export function AdminMobilePage() {
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
    categoryGroups,
    mutations,
    notifySuccess,
    handleHiddenChange,
    setRowSelected,
    setAllRowsSelected,
  } = useAdminCatalogue()

  const showGroupHeaders = categoryGroups.length > 1

  return (
    <div className="min-h-svh w-full bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <AdminMobileMenuDialog
            selectedProducts={selectedProducts}
            selectedCount={selectedCount}
            onSuccess={notifySuccess}
            onOptimisticDeleteMany={mutations.removeManyOptimistic}
            onRestoreProduct={mutations.restoreProduct}
          />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <StoreLogo className="h-10 w-auto shrink-0" />
            <h1 className="truncate text-base font-semibold tracking-tight">Catalogue+ Admin</h1>
          </div>
          <AddProductDialog
            products={products}
            onOptimisticCreate={mutations.addOptimistic}
            onCreateConfirmed={mutations.confirmCreated}
            onCreateFailed={mutations.revertCreated}
            onSuccess={notifySuccess}
            triggerVariant="icon"
          />
        </div>
        {!loading && products.length > 0 && (
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <Checkbox
              aria-label="Select all"
              checked={allRowsSelected}
              indeterminate={someRowsSelected}
              className="size-5"
              onCheckedChange={(checked) => setAllRowsSelected(Boolean(checked))}
            />
            <span className="text-sm text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
            </span>
          </div>
        )}
      </header>

      <main className="px-3 py-4">
        {!supabaseConfigured && <SupabaseConfigNotice />}

        {dbNotReady && <DatabaseSetupNotice />}

        {error && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {loading && supabaseConfigured && <AdminMobilePageSkeleton />}

        {!loading && supabaseConfigured && products.length === 0 && !error && !dbNotReady && (
          <p className="text-sm text-muted-foreground">No items have been added yet.</p>
        )}

        {!loading && products.length > 0 && (
          <div className="space-y-6">
            {categoryGroups.map((group) => (
              <section key={group.category || '__empty__'}>
                {showGroupHeaders && (
                  <h2 className="mb-2 text-sm font-semibold text-foreground">
                    {group.category.trim() || 'Uncategorized'}
                    <span className="ml-2 font-normal text-muted-foreground">
                      ({group.products.length})
                    </span>
                  </h2>
                )}
                <ul className="space-y-3">
                  {group.products.map((product) => (
                    <li key={product.id}>
                      <AdminMobileProductCard
                        product={product}
                        selected={selectedIds.has(product.id)}
                        onSelectedChange={(selected) => setRowSelected(product.id, selected)}
                        onHiddenChange={handleHiddenChange}
                        onOptimisticUpdate={mutations.patchOptimistic}
                        onUpdateConfirmed={mutations.confirmUpdated}
                        onOptimisticDelete={mutations.removeOptimistic}
                        onSuccess={notifySuccess}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
