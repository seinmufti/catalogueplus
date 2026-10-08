import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group z-[200] [&_[data-sonner-toast]]:mx-auto [&_[data-sonner-toast]]:w-fit"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'cn-toast shadow-lg',
          success: '!border-green-600 !bg-green-600 !text-white',
          error: '!border-destructive !bg-destructive !text-white',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
