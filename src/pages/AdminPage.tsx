import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { StoreLogo } from '@/components/StoreLogo'
import { AddProductDialog } from '@/components/admin/AddProductDialog'
import { AdminProductImagePreview } from '@/components/admin/AdminProductImagePreview'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { EditProductDialog } from '@/components/admin/EditProductDialog'
import { ProductHideCheckbox } from '@/components/admin/ProductHideCheckbox'
import { CataloguePreviewDialog } from '@/components/admin/CataloguePreviewDialog'
import { showAdminSuccessToast } from '@/components/admin/adminSuccessToast'
import { toast } from 'sonner'
import type { AdminSuccessDetail } from '@/components/admin/AdminSuccessNotice'
import { DeleteSelectedProductsButton } from '@/components/admin/DeleteSelectedProductsButton'
import { AdminChangePasswordDialog } from '@/components/admin/AdminChangePasswordDialog'
import { AdminProductsTableSkeleton } from '@/components/admin/AdminProductsTableSkeleton'
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
import { AdminCategoryHeaderRow } from '@/components/admin/AdminCategoryHeaderRow'
import {
  mergeCategoryOrderWithLabels,
  moveItemInList,
  readCategoryOrder,
  saveCategoryOrder,
} from '@/lib/categoryOrderStorage'
import { groupProductsByCategory } from '@/lib/groupProductsByCategory'
import { productAdminFullName } from '@/lib/productDisplayTitle'
import {
  getProductWatermarkedImageUrl,
  getPublicImageUrl,
  listProducts,
} from '@/lib/products'
import { ensureWatermarkedImages } from '@/lib/watermarkedImages'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'
import { flushSync } from 'react-dom'

const ROW_SELECT_CHECKBOX_CLASS =
  'size-6 border-neutral-600 dark:border-neutral-400 data-checked:border-primary [&_[data-slot=checkbox-indicator]_svg]:size-4'

/** Shared width for Select + Hide checkbox columns. */
const CHECKBOX_COLUMN_CLASS =
  'relative w-[4.5rem] min-w-[4.5rem] p-0 text-center align-middle [&:has([role=checkbox])]:p-0'

const CHECKBOX_CELL_LABEL_CLASS =
  'flex h-full min-h-14 w-full cursor-pointer items-center justify-center'

const DRAG_START_PX = 5

type CategoryDragSession = {
  category: string
  fromIndex: number
  startY: number
  height: number
  toIndex: number
}

/** Same vertical shift as categoryRowStyle — hit-testing must match visuals. */
function categoryShiftPx(
  index: number,
  fromIndex: number,
  toIndex: number,
  rowHeight: number,
  dragOffsetY: number,
): number {
  if (index === fromIndex) return dragOffsetY
  if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return -rowHeight
  if (fromIndex > toIndex && index >= toIndex && index < fromIndex) return rowHeight
  return 0
}

function measureCategoryDragSession(category: string, startY: number): CategoryDragSession | null {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-category-reorder-row]')]
  if (rows.length === 0) return null
  const fromIndex = rows.findIndex((row) => row.dataset.categoryReorderRow === category)
  if (fromIndex < 0) return null
  const height = rows[fromIndex]?.getBoundingClientRect().height ?? 52
  return {
    category,
    fromIndex,
    startY,
    height,
    toIndex: fromIndex,
  }
}

/** Drop index from pointer vs other rows (exclude dragged row — its center follows the pointer). */
function indexFromLiveRects(clientY: number, fromIndex: number): number {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-category-reorder-row]')]
  if (rows.length === 0) return 0
  let rank = 0
  rows.forEach((row, index) => {
    if (index === fromIndex) return
    const rect = row.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    if (clientY > center) rank++
  })
  return rank
}

const CATEGORY_SHIFT_TRANSITION = 'transform 220ms cubic-bezier(0.33, 1, 0.68, 1)'

function applyCategoryDragTransforms(
  fromIndex: number,
  offsetY: number,
  toIndex: number,
  rowHeight: number,
): void {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const rows = document.querySelectorAll<HTMLElement>('[data-category-reorder-row]')
  rows.forEach((row, index) => {
    const shift = categoryShiftPx(index, fromIndex, toIndex, rowHeight, offsetY)
    if (index === fromIndex) {
      row.style.transform = `translate3d(0, ${shift}px, 0)`
      row.style.transition = 'none'
      row.style.position = 'relative'
      row.style.zIndex = '30'
      return
    }
    if (shift !== 0) {
      row.style.transform = `translate3d(0, ${shift}px, 0)`
      row.style.transition = reduceMotion ? 'none' : CATEGORY_SHIFT_TRANSITION
      return
    }
    row.style.transform = ''
    row.style.transition = reduceMotion ? 'none' : CATEGORY_SHIFT_TRANSITION
  })
}

function clearCategoryDragTransforms(): void {
  document.querySelectorAll<HTMLElement>('[data-category-reorder-row]').forEach((row) => {
    row.style.transform = ''
    row.style.transition = ''
    row.style.position = ''
    row.style.zIndex = ''
  })
}

const COPY_COLUMN_CLASS =
  'relative min-h-14 w-12 min-w-[3rem] p-0 text-center align-middle [&:has([role=checkbox])]:p-0'

export function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbNotReady, setDbNotReady] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const pendingDragRef = useRef<{
    category: string
    startX: number
    startY: number
  } | null>(null)
  const dragSessionRef = useRef<CategoryDragSession | null>(null)
  const lastPointerYRef = useRef(0)
  const dragFrameRef = useRef<number | null>(null)
  const pendingMoveRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const lastAppliedToIndexRef = useRef(-1)
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
      const list = await listProducts()
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

  useEffect(() => {
    if (!supabase) return
    void readCategoryOrder(supabase).then((saved) => {
      setCategoryOrder((prev) =>
        mergeCategoryOrderWithLabels(
          prev.length > 0 ? prev : saved,
          products.map((p) => p.category),
        ),
      )
    })
  }, [products])

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

  const mergedCategoryOrder = useMemo(
    () => mergeCategoryOrderWithLabels(categoryOrder, products.map((p) => p.category)),
    [categoryOrder, products],
  )

  const categoryGroups = useMemo(
    () => groupProductsByCategory(products, mergedCategoryOrder),
    [products, mergedCategoryOrder],
  )

  const collapseProductRows = draggingCategory !== null

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
    [mergedCategoryOrder],
  )

  const hasTable = !loading && products.length > 0
  useEffect(() => {
    const container = tableContainerRef.current
    if (!container || !hasTable) return
    const observer = new ResizeObserver(() => {
      container.style.setProperty('--admin-table-visible-width', `${container.clientWidth}px`)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [hasTable])

  const armCategoryDrag = useCallback((clientX: number, clientY: number, category: string) => {
    pendingDragRef.current = {
      category,
      startX: clientX,
      startY: clientY,
    }
  }, [])

  const handleGripPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, category: string) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      armCategoryDrag(event.clientX, event.clientY, category)
    },
    [armCategoryDrag],
  )

  const handleGripMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, category: string) => {
      if (event.button !== 0) return
      event.preventDefault()
      armCategoryDrag(event.clientX, event.clientY, category)
    },
    [armCategoryDrag],
  )

  useEffect(() => {
    const cancelDragFrame = () => {
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current)
        dragFrameRef.current = null
      }
      pendingMoveRef.current = null
    }

    const runDragFrame = () => {
      dragFrameRef.current = null
      const pending = pendingMoveRef.current
      const session = dragSessionRef.current
      if (!pending || !session) return

      const { clientY } = pending
      const offsetY = clientY - session.startY
      const toIndex = indexFromLiveRects(clientY, session.fromIndex)
      session.toIndex = toIndex

      applyCategoryDragTransforms(session.fromIndex, offsetY, toIndex, session.height)

      if (toIndex !== lastAppliedToIndexRef.current) {
        lastAppliedToIndexRef.current = toIndex
      }
    }

    const scheduleDragFrame = () => {
      if (dragFrameRef.current !== null) return
      dragFrameRef.current = requestAnimationFrame(runDragFrame)
    }

    const finish = (commit: boolean) => {
      cancelDragFrame()
      const session = dragSessionRef.current
      if (commit && session) {
        session.toIndex = indexFromLiveRects(lastPointerYRef.current, session.fromIndex)
      }
      clearCategoryDragTransforms()
      lastAppliedToIndexRef.current = -1
      pendingDragRef.current = null
      dragSessionRef.current = null
      setDraggingCategory(null)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
      document.body.style.removeProperty('touch-action')
      if (commit && session) {
        commitCategoryOrder(session.fromIndex, session.toIndex)
      }
    }

    const handleMove = (clientX: number, clientY: number) => {
      lastPointerYRef.current = clientY

      const pending = pendingDragRef.current
      if (pending && !dragSessionRef.current) {
        const moved = Math.hypot(clientX - pending.startX, clientY - pending.startY)
        if (moved < DRAG_START_PX) return
        const { category, startY } = pending
        pendingDragRef.current = null
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
        document.body.style.touchAction = 'none'
        flushSync(() => {
          setDraggingCategory(category)
        })
        const session = measureCategoryDragSession(category, startY)
        if (!session) {
          setDraggingCategory(null)
          document.body.style.removeProperty('cursor')
          document.body.style.removeProperty('user-select')
          return
        }
        dragSessionRef.current = session
        lastAppliedToIndexRef.current = session.fromIndex
        pendingMoveRef.current = { clientX, clientY }
        runDragFrame()
        return
      }

      const session = dragSessionRef.current
      if (!session) return
      pendingMoveRef.current = { clientX, clientY }
      scheduleDragFrame()
    }

    const onPointerMove = (event: PointerEvent) => {
      handleMove(event.clientX, event.clientY)
    }

    const onMouseMove = (event: MouseEvent) => {
      // Pointer events cover mouse; handling both doubled work and caused jank.
      if (typeof PointerEvent !== 'undefined') return
      if (event.buttons !== 1) return
      handleMove(event.clientX, event.clientY)
    }

    let releaseHandled = false
    const onRelease = () => {
      if (releaseHandled) return
      if (pendingDragRef.current && !dragSessionRef.current) {
        pendingDragRef.current = null
        return
      }
      if (!dragSessionRef.current) return
      releaseHandled = true
      finish(true)
      releaseHandled = false
    }

    const onPointerUp = () => onRelease()
    const onMouseUp = () => onRelease()

    const onPointerCancel = () => finish(false)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(false)
    }

    window.addEventListener('pointermove', onPointerMove, { capture: true })
    window.addEventListener('pointerup', onPointerUp, { capture: true })
    window.addEventListener('pointercancel', onPointerCancel, { capture: true })
    window.addEventListener('mousemove', onMouseMove, { capture: true })
    window.addEventListener('mouseup', onMouseUp, { capture: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelDragFrame()
      window.removeEventListener('pointermove', onPointerMove, { capture: true })
      window.removeEventListener('pointerup', onPointerUp, { capture: true })
      window.removeEventListener('pointercancel', onPointerCancel, { capture: true })
      window.removeEventListener('mousemove', onMouseMove, { capture: true })
      window.removeEventListener('mouseup', onMouseUp, { capture: true })
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [commitCategoryOrder])

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

        {loading && supabaseConfigured && <AdminProductsTableSkeleton />}

        {!loading && supabaseConfigured && products.length === 0 && !error && !dbNotReady && (
          <p className="text-sm text-muted-foreground">No items have been added yet.</p>
        )}

        {!loading && products.length > 0 && (
          <div
            ref={tableContainerRef}
            className="relative w-full overflow-x-auto rounded-lg border"
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
              <TableBody
                className={cn(draggingCategory !== null && 'category-reorder-dragging')}
              >
                {(() => {
                  let rowIndex = 0
                  const showGroupHeaders = categoryGroups.length > 1
                  return categoryGroups.flatMap((group) => {
                    const headerRow = showGroupHeaders ? (
                      <AdminCategoryHeaderRow
                        key={`cat-${group.category}`}
                        category={group.category}
                        productCount={group.products.length}
                        isDragging={draggingCategory === group.category}
                        onGripPointerDown={handleGripPointerDown}
                        onGripMouseDown={handleGripMouseDown}
                      />
                    ) : null

                    const productRows = group.products.map((product) => {
                      rowIndex += 1
                      const imageUrl = getPublicImageUrl(product.image_path)
                      const watermarkedImageUrl = getProductWatermarkedImageUrl(
                        product.image_path,
                      )
                      const selected = selectedIds.has(product.id)
                      return (
                        <TableRow
                          key={product.id}
                          data-state={selected ? 'selected' : undefined}
                          className={cn(
                            'transition-[opacity] duration-150 ease-out motion-reduce:transition-none',
                            collapseProductRows && 'hidden',
                          )}
                        >
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
                                watermarkedImageUrl={watermarkedImageUrl}
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
                          <TableCell className={COPY_COLUMN_CLASS}>
                            <CopyProductImageButton
                              imageUrl={imageUrl}
                              watermarkedImageUrl={watermarkedImageUrl}
                              productLabel={product.product_key}
                            />
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
          </div>
        )}
      </main>
    </div>
  )
}
