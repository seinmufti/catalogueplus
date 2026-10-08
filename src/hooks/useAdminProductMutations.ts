import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { Product } from '@/types/product'
import { insertProductSorted, sortProductsByKey } from '@/lib/optimisticProduct'

export function useAdminProductMutations(
  setProducts: Dispatch<SetStateAction<Product[]>>,
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>,
) {
  const addOptimistic = useCallback(
    (product: Product) => {
      setProducts((prev) => insertProductSorted(prev, product))
    },
    [setProducts],
  )

  const confirmCreated = useCallback(
    (tempId: string, product: Product) => {
      setProducts((prev) =>
        sortProductsByKey(prev.map((p) => (p.id === tempId ? product : p))),
      )
    },
    [setProducts],
  )

  const revertCreated = useCallback(
    (tempId: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== tempId))
    },
    [setProducts],
  )

  const removeOptimistic = useCallback(
    (productId: string): (() => void) => {
      let removed: Product | undefined
      let index = -1
      setProducts((prev) => {
        index = prev.findIndex((p) => p.id === productId)
        if (index === -1) return prev
        removed = prev[index]
        return prev.filter((p) => p.id !== productId)
      })
      setSelectedIds((prev) => {
        if (!prev.has(productId)) return prev
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
      return () => {
        if (!removed || index === -1) return
        setProducts((prev) => {
          if (prev.some((p) => p.id === removed!.id)) return prev
          const next = [...prev]
          next.splice(Math.min(index, next.length), 0, removed!)
          return next
        })
      }
    },
    [setProducts, setSelectedIds],
  )

  const removeManyOptimistic = useCallback(
    (toRemove: Product[]) => {
      const ids = new Set(toRemove.map((p) => p.id))
      setProducts((prev) => prev.filter((p) => !ids.has(p.id)))
      setSelectedIds(new Set())
    },
    [setProducts, setSelectedIds],
  )

  const restoreProduct = useCallback(
    (product: Product) => {
      setProducts((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev
        return insertProductSorted(prev, product)
      })
    },
    [setProducts],
  )

  const patchOptimistic = useCallback(
    (productId: string, patch: Product): (() => void) => {
      let previous: Product | undefined
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p
          previous = p
          return patch
        }),
      )
      return () => {
        if (!previous) return
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? previous! : p)),
        )
      }
    },
    [setProducts],
  )

  const confirmUpdated = useCallback(
    (product: Product) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p)),
      )
    },
    [setProducts],
  )

  return {
    addOptimistic,
    confirmCreated,
    revertCreated,
    removeOptimistic,
    removeManyOptimistic,
    restoreProduct,
    patchOptimistic,
    confirmUpdated,
  }
}
