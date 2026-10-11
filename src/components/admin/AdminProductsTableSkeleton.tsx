import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ROWS = 10

export function AdminProductsTableSkeleton() {
  return (
    <div
      className="w-full overflow-x-auto rounded-lg border"
      aria-busy="true"
      aria-label="Loading products"
    >
      <Table className="w-full [&_td:not(:last-child)]:border-r [&_th:not(:last-child)]:border-r [&_td]:border-border [&_th]:border-border">
        <TableHeader>
          <TableRow>
            {Array.from({ length: 13 }).map((_, i) => (
              <TableHead key={i} className="h-10 px-2">
                <Skeleton className="mx-auto h-4 w-[70%] max-w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: ROWS }).map((_, row) => (
            <TableRow key={row}>
              <TableCell className="p-2">
                <Skeleton className="mx-auto size-6 rounded-sm" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="mx-auto h-4 w-6" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="size-14 rounded-md" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="h-4 w-full min-w-[4rem]" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="h-4 w-full min-w-[5rem]" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="h-4 w-full min-w-[6rem]" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="mx-auto size-6 rounded-sm" />
              </TableCell>
              <TableCell className="min-h-14 p-0">
                <Skeleton className="h-full min-h-14 w-full rounded-none" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="mx-auto h-8 w-16 rounded-md" />
              </TableCell>
              <TableCell className="p-2">
                <Skeleton className="mx-auto h-8 w-[4.5rem] rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
