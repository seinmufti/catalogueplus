import { useEffect, useState } from 'react'
import { IPHONE_17_VIEWPORT } from '@/lib/iphone17Viewport'

/** Bezel padding (`p-2`) on each side of the iPhone 17 screen mockup. */
const BEZEL_PX = 16
/** Matches preview dialog padding (`p-4` × 2). */
const DIALOG_INSET_PX = 32

function viewportHeightPx(): number {
  return document.documentElement.clientHeight || window.innerHeight
}

function viewportWidthPx(): number {
  return document.documentElement.clientWidth || window.innerWidth
}

export function useIphonePreviewScale(enabled: boolean): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!enabled) return

    const totalWidth = IPHONE_17_VIEWPORT.width + BEZEL_PX
    const totalHeight = IPHONE_17_VIEWPORT.height + BEZEL_PX

    function update() {
      const availH = viewportHeightPx() - DIALOG_INSET_PX
      const availW = viewportWidthPx() - DIALOG_INSET_PX
      const scaleH = availH / totalHeight
      const scaleW = availW / totalWidth
      setScale(Math.min(scaleH, scaleW))
    }

    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [enabled])

  return scale
}
