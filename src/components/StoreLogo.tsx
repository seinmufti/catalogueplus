import { cn } from '@/lib/utils'

export const STORE_LOGO_SRC = '/aksesuarat-ali-logo.png'

type StoreLogoProps = {
  className?: string
}

export function StoreLogo({ className }: StoreLogoProps) {
  return (
    <img
      src={STORE_LOGO_SRC}
      alt="Aksesuarat Ali"
      className={cn('object-contain', className)}
    />
  )
}
