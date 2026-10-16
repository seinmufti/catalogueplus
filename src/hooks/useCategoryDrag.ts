import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import {
  DRAG_START_PX,
  applyCategoryDragTransforms,
  applyDragEdgeScroll,
  canScrollVertically,
  categoryDragOffsetY,
  clearCategoryDragTransforms,
  edgeScrollStep,
  grabOffsetInCategoryRow,
  indexFromLiveRects,
  measureCategoryDragSession,
  type CategoryDragSession,
} from '@/lib/categoryDragDom'

/** Pointer-driven drag-to-reorder for the category header rows of the admin table. */
export function useCategoryDrag(commitCategoryOrder: (fromIndex: number, toIndex: number) => void) {
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const pendingDragRef = useRef<{
    category: string
    startX: number
    startY: number
    grabOffsetInRow: number
  } | null>(null)
  const dragSessionRef = useRef<CategoryDragSession | null>(null)
  const lastPointerXRef = useRef(0)
  const lastPointerYRef = useRef(0)
  const dragFrameRef = useRef<number | null>(null)
  const pendingMoveRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const lastAppliedToIndexRef = useRef(-1)

  const armCategoryDrag = useCallback((clientX: number, clientY: number, category: string) => {
    pendingDragRef.current = {
      category,
      startX: clientX,
      startY: clientY,
      grabOffsetInRow: grabOffsetInCategoryRow(clientY, category),
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
      const tableContainer = tableContainerRef.current
      applyDragEdgeScroll(clientY, tableContainer)

      const offsetY = categoryDragOffsetY(session, clientY)
      const toIndex = indexFromLiveRects(clientY, session.fromIndex)
      session.toIndex = toIndex

      applyCategoryDragTransforms(session.fromIndex, offsetY, toIndex, session.height)

      if (toIndex !== lastAppliedToIndexRef.current) {
        lastAppliedToIndexRef.current = toIndex
      }

      const edgeStep = edgeScrollStep(clientY)
      if (edgeStep !== 0 && canScrollVertically(edgeStep, tableContainer)) {
        scheduleDragFrame()
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

    const onScrollWhileDragging = () => {
      if (!dragSessionRef.current) return
      pendingMoveRef.current = {
        clientX: lastPointerXRef.current,
        clientY: lastPointerYRef.current,
      }
      scheduleDragFrame()
    }

    const handleMove = (clientX: number, clientY: number) => {
      lastPointerXRef.current = clientX
      lastPointerYRef.current = clientY

      const pending = pendingDragRef.current
      if (pending && !dragSessionRef.current) {
        const moved = Math.hypot(clientX - pending.startX, clientY - pending.startY)
        if (moved < DRAG_START_PX) return
        const { category, grabOffsetInRow } = pending
        pendingDragRef.current = null
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
        document.body.style.touchAction = 'none'
        flushSync(() => {
          setDraggingCategory(category)
        })
        const session = measureCategoryDragSession(category, grabOffsetInRow)
        if (!session) {
          setDraggingCategory(null)
          document.body.style.removeProperty('cursor')
          document.body.style.removeProperty('user-select')
          return
        }
        dragSessionRef.current = session
        lastAppliedToIndexRef.current = session.fromIndex
        pendingMoveRef.current = { clientX, clientY }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!dragSessionRef.current) return
            dragSessionRef.current.appliedOffsetY = 0
            runDragFrame()
          })
        })
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
    window.addEventListener('scroll', onScrollWhileDragging, { capture: true, passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelDragFrame()
      window.removeEventListener('pointermove', onPointerMove, { capture: true })
      window.removeEventListener('pointerup', onPointerUp, { capture: true })
      window.removeEventListener('pointercancel', onPointerCancel, { capture: true })
      window.removeEventListener('mousemove', onMouseMove, { capture: true })
      window.removeEventListener('mouseup', onMouseUp, { capture: true })
      window.removeEventListener('scroll', onScrollWhileDragging, { capture: true })
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [commitCategoryOrder])

  return { draggingCategory, tableContainerRef, handleGripPointerDown, handleGripMouseDown }
}
