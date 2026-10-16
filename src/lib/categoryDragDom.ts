/** DOM helpers for drag-reordering category header rows in the admin table. */

export const DRAG_START_PX = 5
export const DRAG_EDGE_SCROLL_PX = 80
export const DRAG_EDGE_SCROLL_MAX_STEP = 22

export type CategoryDragSession = {
  category: string
  fromIndex: number
  /** Pointer Y minus row top — captured before product rows collapse. */
  grabOffsetInRow: number
  /** Last transform applied to the dragged row (for layout-top math). */
  appliedOffsetY: number
  height: number
  toIndex: number
}

export function edgeScrollStep(clientY: number): number {
  const viewportHeight = window.innerHeight
  if (clientY >= viewportHeight - DRAG_EDGE_SCROLL_PX) {
    const depth = (clientY - (viewportHeight - DRAG_EDGE_SCROLL_PX)) / DRAG_EDGE_SCROLL_PX
    return Math.min(DRAG_EDGE_SCROLL_MAX_STEP, Math.max(1, depth * DRAG_EDGE_SCROLL_MAX_STEP))
  }
  if (clientY <= DRAG_EDGE_SCROLL_PX) {
    const depth = (DRAG_EDGE_SCROLL_PX - clientY) / DRAG_EDGE_SCROLL_PX
    return -Math.min(DRAG_EDGE_SCROLL_MAX_STEP, Math.max(1, depth * DRAG_EDGE_SCROLL_MAX_STEP))
  }
  return 0
}

export function canScrollVertically(delta: number, tableContainer: HTMLElement | null): boolean {
  if (delta > 0) {
    const docBottom = document.documentElement.scrollHeight - window.innerHeight
    if (window.scrollY < docBottom - 1) return true
    if (
      tableContainer &&
      tableContainer.scrollTop < tableContainer.scrollHeight - tableContainer.clientHeight - 1
    ) {
      return true
    }
    return false
  }
  if (delta < 0) {
    if (window.scrollY > 0) return true
    if (tableContainer && tableContainer.scrollTop > 0) return true
    return false
  }
  return false
}

/** Scroll window / table when the pointer sits in the top or bottom edge band. */
export function applyDragEdgeScroll(clientY: number, tableContainer: HTMLElement | null): boolean {
  const delta = edgeScrollStep(clientY)
  if (delta === 0 || !canScrollVertically(delta, tableContainer)) return false

  let scrolled = false
  const scrollBefore = window.scrollY
  window.scrollBy(0, delta)
  if (window.scrollY !== scrollBefore) scrolled = true

  if (tableContainer) {
    const tableBefore = tableContainer.scrollTop
    tableContainer.scrollBy(0, delta)
    if (tableContainer.scrollTop !== tableBefore) scrolled = true
  }

  return scrolled
}

export function grabOffsetInCategoryRow(clientY: number, category: string): number {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-category-reorder-row]')]
  const row = rows.find((el) => el.dataset.categoryReorderRow === category)
  if (!row) return 0
  const grip = row.querySelector<HTMLElement>('button[aria-label^="Drag to reorder"]')
  const rowTop = row.getBoundingClientRect().top
  if (grip) {
    const gripRect = grip.getBoundingClientRect()
    return gripRect.top + gripRect.height / 2 - rowTop
  }
  return clientY - rowTop
}

export function categoryDragOffsetY(session: CategoryDragSession, clientY: number): number {
  const rows = document.querySelectorAll<HTMLElement>('[data-category-reorder-row]')
  const row = rows[session.fromIndex]
  if (!row) return session.appliedOffsetY

  const grip = row.querySelector<HTMLElement>('button[aria-label^="Drag to reorder"]')
  if (grip) {
    const gripRect = grip.getBoundingClientRect()
    const gripCenterY = gripRect.top + gripRect.height / 2
    session.appliedOffsetY += clientY - gripCenterY
    return session.appliedOffsetY
  }

  const layoutTop = row.getBoundingClientRect().top - session.appliedOffsetY
  session.appliedOffsetY = clientY - session.grabOffsetInRow - layoutTop
  return session.appliedOffsetY
}

/** Same vertical shift as categoryRowStyle — hit-testing must match visuals. */
export function categoryShiftPx(
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

export function measureCategoryDragSession(
  category: string,
  grabOffsetInRow: number,
): CategoryDragSession | null {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-category-reorder-row]')]
  if (rows.length === 0) return null
  const fromIndex = rows.findIndex((row) => row.dataset.categoryReorderRow === category)
  if (fromIndex < 0) return null
  const height = rows[fromIndex]?.getBoundingClientRect().height ?? 52
  return {
    category,
    fromIndex,
    grabOffsetInRow,
    appliedOffsetY: 0,
    height,
    toIndex: fromIndex,
  }
}

/** Drop index from pointer vs other rows (exclude dragged row — its center follows the pointer). */
export function indexFromLiveRects(clientY: number, fromIndex: number): number {
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

export const CATEGORY_SHIFT_TRANSITION = 'transform 220ms cubic-bezier(0.33, 1, 0.68, 1)'

export function applyCategoryDragTransforms(
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

export function clearCategoryDragTransforms(): void {
  document.querySelectorAll<HTMLElement>('[data-category-reorder-row]').forEach((row) => {
    row.style.transform = ''
    row.style.transition = ''
    row.style.position = ''
    row.style.zIndex = ''
  })
}
