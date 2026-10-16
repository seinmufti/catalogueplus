/**
 * Deletes the old config/*.json files from the public storage bucket (including the old admin
 * password hash). Run once, after migration 006 has been applied and the app is working.
 * Usage: node scripts/cleanup-config.mjs   (needs ADMIN_EMAIL / ADMIN_PASSWORD, see scripts/lib/admin-client.mjs)
 */
import { bucket, createAdminClient } from './lib/admin-client.mjs'

const client = await createAdminClient()
const { data, error } = await client.storage.from(bucket).list('config', { limit: 100 })
if (error) {
  console.error('Could not list config/:', error.message)
  process.exit(1)
}

const paths = (data ?? []).filter((f) => f.name.endsWith('.json')).map((f) => `config/${f.name}`)
if (paths.length === 0) {
  console.log('Nothing to remove.')
  process.exit(0)
}

const { error: removeError } = await client.storage.from(bucket).remove(paths)
if (removeError) {
  console.error('Could not remove files:', removeError.message)
  process.exit(1)
}
console.log(`Removed ${paths.length} file(s):\n  ${paths.join('\n  ')}`)
