import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  formatAdminSuccessMessage,
  type AdminSuccessDetail,
} from '@/components/admin/AdminSuccessNotice'
import { CircleCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

export function showAdminSuccessToast(detail: AdminSuccessDetail) {
  const message = formatAdminSuccessMessage(detail)
  toast.custom(
    () => (
      <Alert
        variant="success"
        className="mx-auto flex w-fit min-w-[12rem] items-center gap-2 shadow-lg [&>svg]:static [&>svg]:translate-y-0"
      >
        <CircleCheckIcon aria-hidden />
        <AlertDescription className="col-start-auto font-medium text-white">{message}</AlertDescription>
      </Alert>
    ),
    {
      duration: 5000,
      classNames: {
        toast: '!mx-auto !w-fit !justify-center',
      },
    },
  )
}
