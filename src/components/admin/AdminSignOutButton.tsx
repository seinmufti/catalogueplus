import { Button } from '@/components/ui/button'
import { signOutAdmin } from '@/lib/adminAuth'

export function AdminSignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-10"
      onClick={() => void signOutAdmin()}
    >
      Sign out
    </Button>
  )
}
