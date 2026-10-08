import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { downloadCatalogueBackup } from '@/lib/backup'
import { supabaseConfigured } from '@/lib/supabase'
import { Download } from 'lucide-react'

export function DownloadBackupButton() {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured.')
      return
    }
    setDownloading(true)
    try {
      await downloadCatalogueBackup()
      toast.success('Backup downloaded.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create backup.'
      toast.error(message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      size="lg"
      className="h-10 border border-blue-600 bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
      disabled={!supabaseConfigured || downloading}
      onClick={() => void handleDownload()}
    >
      <Download className="size-4" />
      {downloading ? 'Preparing…' : 'Download Backup'}
    </Button>
  )
}
