import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { showAdminSuccessToast } from '@/components/admin/adminSuccessToast'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { useAdminProductMutations } from '@/hooks/useAdminProductMutations'
import { mergeCategoryOrderWithLabels, readCategoryOrder } from '@/lib/categoryOrder'
import { formatLoadError, isProductsTableMissingError } from '@/lib/errors'
import { groupProductsByCategory } from '@/lib/groupProductsByCategory'
import { listProducts } from '@/lib/products'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { ensureWatermarkedImages } from '@/lib/watermarkedImages'
import type { Product } from '@/types/product'

/** Shared state for the desktop and mobile admin pages. */
export function useAdminCatalogue() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(supabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [dbNotReady, setDbNotReady] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [categoryOrder, setCategoryOrder] = useState<string[] | null>(null)

  const mutations = useAdminProductMutations(setProducts, setSelectedIds)

  const notifySuccess = useCallback((detail: AdminSuccessDetail) => {
    showAdminSuccessToast(detail)
  }, [])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    async function load() {
      try {
        // Saved order is optional; fall back to alphabetical when it cannot be read.
        const [list, saved] = await Promise.all([
          listProducts(),
          supabase ? readCategoryOrder(supabase).catch(() => null) : null,
        ])
        if (cancelled) return
        setCategoryOrder((prev) => prev ?? saved)
        setProducts(list)
        if (supabase) {
          void ensureWatermarkedImages(
            supabase,
            list.map((p) => p.image_path),
          ).then(({ generated, failed }) => {
            if (generated > 0) toast.success(`Created ${generated} watermarked image(s).`)
            if (failed > 0) toast.error(`Could not watermark ${failed} image(s).`)
          })
        }
      } catch (err) {
        if (cancelled) return
        if (isProductsTableMissingError(err)) setDbNotReady(true)
        else setError(formatLoadError(err, 'Failed to load products.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const mergedCategoryOrder = useMemo(
    () => mergeCategoryOrderWithLabels(categoryOrder, products.map((p) => p.category)),
    [categoryOrder, products],
  )

  const categoryGroups = useMemo(
    () => groupProductsByCategory(products, mergedCategoryOrder),
    [products, mergedCategoryOrder],
  )

  const handleHiddenChange = useCallback((productId: string, hidden: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, hidden } : p)))
  }, [])

  const setRowSelected = useCallback((productId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(productId)
      else next.delete(productId)
      return next
    })
  }, [])

  const setAllRowsSelected = useCallback(
    (selected: boolean) => {
      setSelectedIds(selected ? new Set(products.map((p) => p.id)) : new Set())
    },
    [products],
  )

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.has(p.id)),
    [products, selectedIds],
  )
  const selectedCount = selectedProducts.length
  const allRowsSelected = products.length > 0 && selectedCount === products.length
  const someRowsSelected = selectedCount > 0 && !allRowsSelected

  return {
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
  }
}
