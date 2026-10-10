import { createContext, useContext, type ReactNode, type RefObject } from 'react'

const CustomerPhonePortalContext = createContext<RefObject<HTMLElement | null> | null>(
  null,
)

export function CustomerPhonePortalProvider({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLElement | null>
  children: ReactNode
}) {
  return (
    <CustomerPhonePortalContext.Provider value={containerRef}>
      {children}
    </CustomerPhonePortalContext.Provider>
  )
}

/** When catalogue runs inside {@link CustomerPhoneFrame}, dialogs portal into the screen. */
export function useCustomerPhonePortalContainer(): RefObject<HTMLElement | null> | null {
  return useContext(CustomerPhonePortalContext)
}
