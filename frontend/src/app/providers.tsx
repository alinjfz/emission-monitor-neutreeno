/** Cross-cutting React providers shared by every route. */
import type { PropsWithChildren } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/auth-context'

/** Compose global tooltip, authentication, and notification providers. */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <TooltipProvider delayDuration={350}>
      <AuthProvider>
        {children}
        <Toaster duration={4000} position="bottom-right" richColors closeButton />
      </AuthProvider>
    </TooltipProvider>
  )
}
