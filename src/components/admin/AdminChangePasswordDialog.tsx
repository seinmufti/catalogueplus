import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { changeAdminPassword } from '@/lib/adminAuth'
import { supabaseConfigured } from '@/lib/supabase'

export function AdminChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const result = await changeAdminPassword(oldPassword, newPassword)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Password updated.')
      resetForm()
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="lg" className="h-10" />}>
        Change password
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change admin password</DialogTitle>
          <DialogDescription>
            Enter your current password and a new one. This app does not offer password recovery —
            forgetting the password does not delete catalogue data, but you will need the current
            password to change it.
          </DialogDescription>
        </DialogHeader>
        {!supabaseConfigured ? (
          <p className="text-sm text-destructive" role="alert">
            Supabase must be configured to save a new password.
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={4}
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={4}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
