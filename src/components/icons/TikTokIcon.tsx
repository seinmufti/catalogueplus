import { cn } from '@/lib/utils'

type Props = { className?: string }

/** Official-style TikTok note (cyan / pink / black). */
export function TikTokIcon({ className }: Props) {
  return (
    <img
      src="/tiktok-logo.svg"
      alt=""
      width={20}
      height={20}
      className={cn('size-5 shrink-0 object-contain', className)}
      aria-hidden
      decoding="async"
    />
  )
}
