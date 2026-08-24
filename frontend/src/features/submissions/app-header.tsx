import { useState } from 'react'
import { DatabaseBackup, LogOut, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/use-auth'
import { ApiError } from '@/lib/api-client'

import { developerApi } from './developer-api'

export function AppHeader({ onAdd }: { onAdd: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reseedOpen, setReseedOpen] = useState(false)
  const [reseeding, setReseeding] = useState(false)
  const reseedEnabled = import.meta.env.VITE_ENABLE_DATABASE_RESEED === 'true'

  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      toast.error('Unable to log out. Please try again.')
    }
  }

  async function handleReseed() {
    setReseeding(true)
    try {
      await developerApi.reseedDatabase()
      window.location.replace('/login')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Unable to reseed the database.')
      setReseeding(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-[15px] font-semibold tracking-tight">Emissions Monitor</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="px-2 text-sm font-medium" aria-label="Open account menu">
              {user?.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={onAdd}>
              <Plus aria-hidden="true" /> Add submission
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {reseedEnabled && (
              <>
                <DropdownMenuItem variant="destructive" onSelect={() => setReseedOpen(true)}>
                  <DatabaseBackup aria-hidden="true" /> Reset demo database
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut aria-hidden="true" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={reseedOpen} onOpenChange={(open) => !reseeding && setReseedOpen(open)}>
        <DialogContent
          showCloseButton={!reseeding}
          onEscapeKeyDown={(event) => reseeding && event.preventDefault()}
          onPointerDownOutside={(event) => reseeding && event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Reset the demo database?</DialogTitle>
            <DialogDescription>
              This permanently removes all users, sessions, review history, and submission changes,
              then recreates the original demo data. You will be signed out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={reseeding} onClick={() => setReseedOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={reseeding} onClick={() => void handleReseed()}>
              {reseeding && <Spinner />}
              {reseeding ? 'Resetting…' : 'Reset database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
