import { TikTokIcon } from '@/components/icons/TikTokIcon'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { StoreLogo } from '@/components/StoreLogo'
import {
  STORE_DISPLAY_NAME,
  STORE_TIKTOK_HANDLE,
  STORE_TIKTOK_URL,
  STORE_WHATSAPP_DISPLAY,
  STORE_WHATSAPP_URL,
} from '@/lib/store'

const linkClass =
  'inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Overlay footer — customer catalogue + admin phone preview. */
export function CustomerCatalogueFooter() {
  return (
    <footer
      dir="ltr"
      lang="en"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-2"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-md rounded-t-xl border border-b-0 border-border/80 bg-background/94 px-3 py-2.5 shadow-[0_-10px_28px_rgb(0_0_0/0.1)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-2 text-center">
          <a
            href={STORE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            aria-label={`WhatsApp ${STORE_WHATSAPP_DISPLAY}`}
          >
            <WhatsAppIcon className="size-5 shrink-0" />
            <span>{STORE_WHATSAPP_DISPLAY}</span>
          </a>
          <a
            href={STORE_TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            aria-label={`TikTok ${STORE_TIKTOK_HANDLE}`}
          >
            <TikTokIcon className="size-5 shrink-0" />
            <span>{STORE_TIKTOK_HANDLE}</span>
          </a>
        </div>
        <div className="flex items-center justify-center gap-2.5 border-t border-border/60 pt-2">
          <StoreLogo className="h-9 w-auto shrink-0" />
          <span className="text-left text-base font-semibold tracking-tight">{STORE_DISPLAY_NAME}</span>
        </div>
      </div>
    </footer>
  )
}
