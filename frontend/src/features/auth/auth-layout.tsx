/** Shared presentational shell for login and registration forms. */
import type { PropsWithChildren, ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthLayoutProps extends PropsWithChildren {
  title: string
  description: string
  footer: ReactNode
}

/** Render the shared centered card used by authentication screens. */
export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fafafa] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="text-base font-semibold tracking-tight">Emissions Monitor</p>
        </div>
        <Card className="gap-0 border-[#e5e5e5] py-0 shadow-sm">
          <CardHeader className="px-6 pt-6 pb-5 text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">{children}</CardContent>
        </Card>
        <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </main>
  )
}
