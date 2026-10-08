import { TikTokIcon } from '@/components/icons/TikTokIcon'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import {
  STORE_TIKTOK_HANDLE,
  STORE_TIKTOK_URL,
  STORE_WHATSAPP_LINES,
} from '@/lib/store'

const filledBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 font-semibold tabular-nums no-underline shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]'

const whatsappButtonClass = `${filledBase} min-w-0 flex-1 bg-[#25D366] text-sm text-white hover:bg-[#20bd5a] active:bg-[#1da851] sm:text-base`

const tiktokButtonClass = `${filledBase} w-full bg-black text-base text-white hover:bg-neutral-900 active:bg-neutral-950`

/** In-flow footer — customer catalogue + admin phone preview. */
export function CustomerCatalogueFooter() {
  return (
    <footer
      dir="ltr"
      lang="en"
      className="w-full shrink-0 px-2 pt-1"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex w-full max-w-md min-h-[calc(2svh+2.75rem)] flex-col rounded-t-xl border border-border/80 bg-background px-3 py-[calc(0.625rem+1svh)] shadow-[0_-4px_16px_rgb(0_0_0/0.06)]">
        <div className="flex min-h-0 flex-1 w-full flex-col justify-evenly gap-2">
          <div className="flex w-full items-stretch gap-2">
            {STORE_WHATSAPP_LINES.map((line) => (
              <a
                key={line.url}
                href={line.url}
                target="_blank"
                rel="noopener noreferrer"
                className={whatsappButtonClass}
                aria-label={`WhatsApp ${line.display}`}
              >
                <WhatsAppIcon className="size-5 shrink-0 text-white sm:size-6" />
                <span className="whitespace-nowrap">{line.display}</span>
              </a>
            ))}
          </div>
          <a
            href={STORE_TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={tiktokButtonClass}
            aria-label={`TikTok ${STORE_TIKTOK_HANDLE}`}
          >
            <TikTokIcon className="size-6 shrink-0" />
            <span className="whitespace-nowrap">{STORE_TIKTOK_HANDLE}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
