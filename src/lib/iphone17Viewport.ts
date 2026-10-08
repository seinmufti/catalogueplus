/** Apple iPhone 17 display — portrait width × height (physical pixels). */
export const IPHONE_17_NATIVE = {
  width: 1206,
  height: 2622,
} as const

/** CSS viewport (3×) — same aspect as 1206×2622. */
export const IPHONE_17_VIEWPORT = {
  width: IPHONE_17_NATIVE.width / 3,
  height: IPHONE_17_NATIVE.height / 3,
} as const

export const IPHONE_17_ASPECT_RATIO = `${IPHONE_17_NATIVE.width} / ${IPHONE_17_NATIVE.height}`

export const IPHONE_17_SAFE_AREA = {
  top: 62,
  bottom: 34,
} as const
