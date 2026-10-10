import { useRef, type CSSProperties, type ReactNode } from 'react'
import { CustomerPhonePortalProvider } from '@/components/customer/CustomerPhonePortalContext'
import { useIphonePreviewScale } from '@/hooks/useIphonePreviewScale'
import { IPHONE_17_ASPECT_RATIO, IPHONE_17_VIEWPORT } from '@/lib/iphone17Viewport'
import { cn } from '@/lib/utils'

type CustomerPhoneFrameProps = {
  children: ReactNode
  className?: string
  variant?: 'simple' | 'iphone'
  /** Scale the full iPhone 17 mockup to fit within 100vh (admin preview modal). */
  fitWithinViewport?: boolean
}

const { width: IPHONE_W, height: IPHONE_H } = IPHONE_17_VIEWPORT
const BEZEL_PX = 16

const iphone17ScreenStyle: CSSProperties = {
  width: IPHONE_W,
  height: IPHONE_H,
}

const iphone17FitScreenStyle: CSSProperties = {
  width: `min(${IPHONE_W}px, calc(100vw - 2rem), calc((100dvh - 2rem) * ${IPHONE_W} / ${IPHONE_H}))`,
  aspectRatio: IPHONE_17_ASPECT_RATIO,
}

export function CustomerPhoneFrame({
  children,
  className,
  variant = 'simple',
  fitWithinViewport = false,
}: CustomerPhoneFrameProps) {
  const previewScale = useIphonePreviewScale(variant === 'iphone' && fitWithinViewport)
  const portalContainerRef = useRef<HTMLDivElement>(null)

  if (variant === 'iphone') {
    const deviceWidth = IPHONE_W + BEZEL_PX
    const deviceHeight = IPHONE_H + BEZEL_PX

    const phone = (
      <div className="rounded-[2.5rem] bg-neutral-950 p-2 shadow-2xl ring-1 ring-neutral-800">
        <div
          ref={portalContainerRef}
          className="relative overflow-hidden rounded-[2rem] bg-background"
          style={{ ...iphone17ScreenStyle, aspectRatio: IPHONE_17_ASPECT_RATIO }}
        >
          <CustomerPhonePortalProvider containerRef={portalContainerRef}>
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>
          </CustomerPhonePortalProvider>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center"
            aria-hidden
          >
            <div className="h-1 w-[34%] min-w-[6.5rem] max-w-[8.75rem] rounded-full bg-foreground/35" />
          </div>
        </div>
      </div>
    )

    if (fitWithinViewport) {
      return (
        <div
          className={cn('mx-auto shrink-0', className)}
          style={{
            width: deviceWidth * previewScale,
            height: deviceHeight * previewScale,
          }}
        >
          <div
            style={{
              width: deviceWidth,
              height: deviceHeight,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }}
          >
            {phone}
          </div>
        </div>
      )
    }

    return <div className={cn('mx-auto w-fit', className)}>{phone}</div>
  }

  return (
    <div
      ref={portalContainerRef}
      className={cn(
        'relative flex flex-col overflow-hidden',
        'rounded-xl border border-border bg-background shadow-lg',
        className,
      )}
      style={iphone17FitScreenStyle}
    >
      <CustomerPhonePortalProvider containerRef={portalContainerRef}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </CustomerPhonePortalProvider>
    </div>
  )
}
