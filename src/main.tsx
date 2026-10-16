import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { publicAssetPath } from './lib/router-basename'

// Favicon links in index.html are root-relative; add the /catalogueplus prefix when proxied under nordlyssolutions.com.
for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]')) {
  const href = link.getAttribute('href')
  if (href) link.setAttribute('href', publicAssetPath(href))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
