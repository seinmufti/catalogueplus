import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

const { devPort: designatedDevPort } = JSON.parse(
  readFileSync(path.join(rootDir, '.cursor/designation.json'), 'utf8'),
) as { devPort: number }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    host: true,
    port: designatedDevPort,
    strictPort: true,
  },
  preview: {
    port: designatedDevPort,
    strictPort: true,
  },
})
