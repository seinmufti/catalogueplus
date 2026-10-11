import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { GripVertical } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type AdminCategoryHeaderRowProps = {
  category: string
  productCount: number
  isDragging?: boolean
  onGripPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, category: string) => void
  onGripMouseDown: (event: ReactMouseEvent<HTMLButtonElement>, category: string) => void
}

/** Category section header inside the admin products table. */
export function AdminCategoryHeaderRow({
  category,
  productCount,
  isDragging = false,
  onGripPointerDown,
  onGripMouseDown,
}: AdminCategoryHeaderRowProps) {
  return (
    <TableRow
      data-category-reorder-row={category}
      className={cn(
        'select-none border-t-2 border-t-border bg-muted/30 hover:bg-muted/30',
        isDragging && 'relative z-30 cursor-grabbing shadow-lg',
      )}
    >
      <TableCell
        colSpan={13}
        className="bg-gradient-to-r from-purple-600 to-purple-950 p-0 dark:from-purple-500 dark:to-purple-950"
      >
        <div className="sticky left-0 flex min-h-[2.8125rem] w-[var(--admin-table-visible-width,100%)] max-w-full items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            aria-label={`Drag to reorder ${category}`}
            className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded-sm p-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white active:cursor-grabbing"
            onPointerDown={(event) => onGripPointerDown(event, category)}
            onMouseDown={(event) => onGripMouseDown(event, category)}
          >
            <GripVertical className="size-5" aria-hidden />
          </button>
          <span
            dir="rtl"
            lang="ar"
            className="min-w-0 flex-1 truncate text-start text-lg font-semibold leading-snug text-white"
          >
            {category}
          </span>
          <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums text-white">
            {productCount}
          </span>
        </div>
      </TableCell>
    </TableRow>
  )
}
